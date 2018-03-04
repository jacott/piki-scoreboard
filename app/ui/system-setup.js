define(function(require, exports, module) {
  const koru  = require('koru');
  const Dom   = require('koru/dom');
  const Form  = require('koru/ui/form');
  const Route = require('koru/ui/route');
  const util  = require('koru/util');
  const Org   = require('models/org');
  const User  = require('models/user');
  const App   = require('./app');

  const Tpl = Dom.newTemplate(require('koru/html!./system-setup'));

  const $ = Dom.current;

  const base = Route.root.addBase(module, Tpl);

  koru.onunload(module, ()=>{Route.root.removeBase(Tpl)});

  base.addTemplate(module, Tpl.Index, {defaultPage: true});
  base.addTemplate(module, Tpl.OrgForm, {
    data(page, pageRoute) {
      return Org.findById(pageRoute.append) || new Org();
    }
  });
  base.addTemplate(module, Tpl.UserForm, {
    data(page, pageRoute) {
      return User.findById(pageRoute.append) || new User({org_id: App.orgId});
    }
  });


  Tpl.$extend({
    title: "Org settings",
    onBaseEntry() {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit() {
      Dom.removeId('SystemSetup');
    },
  });

  Tpl.$helpers({
    org() {
      return App.org();
    },

    orgList(each) {
      return {
        query: Org.query,
        compare: util.compareByName,
      };
    },

    userList(each) {
      return {
        query: User.query,
        compare: util.compareByName,
      };
    },
  });

  Tpl.$events({
    'click [name=cancel]'(event) {
      Dom.stopEvent();
      Route.history.back();
    },

    'click [name=delete]'(event) {
      var doc = $.data(event.currentTarget.querySelector('form'));

      Dom.stopEvent();
      Dom.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Delete',
        content: Tpl.ConfirmDelete,
        callback(confirmed) {
          if (confirmed) {
            if (doc.constructor === User) {
              doc.changes = {org_id: doc.org_id, role: null};
              doc.$$save();
            } else {
              doc.$remove();
            }
            Route.replacePath(Tpl);
          }
        },
      });

    },

    'click .orgs tr'(event) {
      if (! Dom.hasClass(document.body, 'sAccess')) return;
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.OrgForm, {append: data._id});
    },

    'click .users tr'(event) {
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.UserForm, {append: data._id});
    },
  });



  Tpl.OrgForm.$events({
    'click [type=submit]': Form.submitFunc('OrgForm', Tpl),
  });

  Tpl.UserForm.$helpers({
    orgList() {
      return Org.query.fetch().sort(util.compareByName);
    },

    roleList() {
      var su = User.me().isSuperUser();
      var role =  User.ROLE;
      var results = [];
      for(var name in role) {
        if (su || name !== 'superUser')
          results.push([role[name], util.capitalize(util.humanize(name))]);
      }
      return results;
    },
  });

  Tpl.UserForm.$events({
    'click [type=submit]': Form.submitFunc('UserForm', {
      success: Tpl,
      save(doc) {
        doc.changes.org_id = doc.org_id;

        return doc.$save();
      }
    }),
  });

  App.restrictAccess(Tpl.Index);
  App.restrictAccess(Tpl.UserForm);
  App.restrictAccess(Tpl.OrgForm);

  return Tpl;
});
