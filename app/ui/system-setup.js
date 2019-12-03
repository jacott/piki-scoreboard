define(function(require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const Session         = require('koru/session');
  const Dialog          = require('koru/ui/dialog');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const SelectMenu      = require('koru/ui/select-menu');
  const util            = require('koru/util');
  const Org             = require('models/org');
  const User            = require('models/user');
  const App             = require('./app');

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
      const elm = Tpl.$autoRender({});
      base.childAnchor = elm.querySelector('#SystemSetupBody');
      document.body.appendChild(elm);
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

  const EXPORT_FILENAMES = {
    sql: 'piki-pg.sql',
    csv: 'piki-csv.zip',
  };

  Tpl.$events({
    'menustart [name=export]'(event) {
      Dom.stopEvent();

      SelectMenu.popup(this, {
        list: [
          ['sql', 'As PgSQL file'],
          ['csv', 'As CSV ZIP file'],
        ],

        onSelect: elm=>{
          const location = koru.getLocation();

          const id = $.data(elm)._id;

          App.iframeGet({
            id: "iframeExportOrg",
            src: `/export/${id}/${EXPORT_FILENAMES[id]}?${App.orgId}&${Session.sessAuth}`,
            errorMsg: "Export Data failed",
          });
          return true;
        }

      });
    },
    'click [name=cancel]'(event) {
      Dom.stopEvent();
      Route.history.back();
    },

    'click [name=delete]'(event) {
      var doc = $.data(event.currentTarget.querySelector('form'));

      Dom.stopEvent();
      Dom.tpl.Dialog.confirm({
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
