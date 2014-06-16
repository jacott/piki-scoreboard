define(function(require, exports, module) {
  var Dom    = require('koru/dom');
  var Route = require('koru/ui/route');
  var Form = require('koru/ui/form');
  var User = require('models/user');
  var Org = require('models/org');
  var App = require('./app-base');
  var util = require('koru/util');
  var env = require('koru/env');

  var Tpl = Dom.newTemplate(require('koru/html!./system-setup'));

  var $ = Dom.current;

  var base = Route.root.addBase(Tpl);

  env.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  base.addTemplate(Tpl.Index, {defaultPage: true});
  base.addTemplate(Tpl.OrgForm, {
    data: function (page, pageRoute) {
      return Org.findById(pageRoute.append) || new Org();
    }
  });
  base.addTemplate(Tpl.UserForm, {
    data: function (page, pageRoute) {
      return User.findById(pageRoute.append) || new User({org_id: App.orgId});
    }
  });


  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit: function () {
      Dom.removeId('SystemSetup');
    },
  });

  Tpl.$helpers({
    org: function () {
      return App.org();
    },

    orgList: function (callback) {
      callback.render({model: Org, sort: util.compareByName});
    },

    userList: function (callback) {
      callback.render({model: User, sort: util.compareByName});
    },
  });

  Tpl.$events({
    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Route.history.back();
    },

    'click [name=delete]': function (event) {
      var doc = $.data(event.currentTarget.querySelector('form'));

      Dom.stopEvent();
      Dom.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Delete',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            Route.replacePath(Tpl);
          }
        },
      });

    },

    'click .orgs tr': function (event) {
      if (! Dom.hasClass(document.body, 'sAccess')) return;
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.OrgForm, {append: data._id});
    },

    'click .users tr': function (event) {
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.UserForm, {append: data._id});
    },
  });



  Tpl.OrgForm.$events({
    'click [type=submit]': Form.submitFunc('OrgForm', Tpl),
  });

  Tpl.UserForm.$helpers({
    orgList: function () {
      return Org.query.fetch().sort(util.compareByName);
    },

    roleList: function () {
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
    'click [type=submit]': Form.submitFunc('UserForm', Tpl),
  });

  return Tpl;
});
