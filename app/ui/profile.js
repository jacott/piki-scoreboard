define(function(require, exports, module) {
  var Dom    = require('koru/dom');
  var Route = require('koru/ui/route');
  var UserAccount = require('koru/user-account');
  var Form = require('koru/ui/form');
  var User = require('models/user');
  var Home = require('ui/home');
  var Dialog = require('koru/ui/dialog');
  var SystemSetup = require('./system-setup');
  var env = require('koru/env');

  var Tpl = Dom.newTemplate(require('koru/html!./profile'));

  var base = Route.root.addBase(Tpl);
  env.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  var $ = Dom.current;
  var ChangePassword = Tpl.ChangePassword;

  base.addTemplate(Tpl.Index, {
    focus: true,
    defaultPage: true,
  });

  base.addTemplate(Tpl.ChangePassword, {focus: true});

  Tpl.$helpers({
    systemSetup: function () {
      var user = $.data();
      if (user && user.isSuperUser()) {
        return Form.pageLink({value: "System setup", template: "SystemSetup"});
      }
    },
  });

  Tpl.$events({
    'click [name=signOut]': function (event) {
      Dom.stopEvent();
      UserAccount.logout();
    },

    'click [name=signOutOthers]': function (event) {
      Dom.stopEvent();

      var elm = Tpl.SignOutOthers.$autoRender({});

      Dialog.open(elm);

      UserAccount.logoutOtherClients(function (error) {
        elm.firstChild.textContent = error ? 'Unexpected error.' :
          'You have been signed out of any other sessions.';
      });
    },
  });

  Tpl.SignOutOthers.$events({
    'click [name=close]': function (event) {
      Dom.stopEvent();
      Dialog.close('SignOutOthers');
    },
  });

  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender(User.me()));
    },

    onBaseExit: function () {
      Dom.removeId('Profile');
    },

    $created: function (ctx) {
      ctx.onDestroy(UserAccount.onChange(function () {
        Route.replacePath(Home);
      }));
    },
  });

  ChangePassword.$events({
    'submit': function (event) {
      Dom.stopEvent();
      var form = event.currentTarget;
      var oldPassword = form.querySelector('[name=oldPassword]').value;
      var newPassword = form.querySelector('[name=newPassword]');

      Dom.addClass(form, 'submitting');

      UserAccount.changePassword(oldPassword, newPassword.value, function (error) {
        if (error) {
          Dom.removeClass(form, 'submitting');
          Form.renderError(form, 'oldPassword', 'invalid password.');
        } else {
          Route.history.back();
        }
      });

    },

    'input [name=newPassword],[name=confirm]': function (event) {
      Dom.stopEvent();

      var form = event.currentTarget;
      var newPassword = form.querySelector('[name=newPassword]').value;
      var confirm = form.querySelector('[name=confirm]').value;
      var submit = form.querySelector('[type=submit]');

      if (newPassword.length >= 5 && newPassword === confirm)
        submit.removeAttribute('disabled');
      else
        submit.setAttribute('disabled', 'disabled');
    },
  });

  return Tpl;
});
