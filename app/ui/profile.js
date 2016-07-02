define(function(require, exports, module) {
  const koru        = require('koru');
  const Dom         = require('koru/dom');
  const session     = require('koru/session');
  const Dialog      = require('koru/ui/dialog');
  const Form        = require('koru/ui/form');
  const Route       = require('koru/ui/route');
  const UserAccount = require('koru/user-account');
  const login       = require('koru/user-account/client-login');
  const User        = require('models/user');
  const Home        = require('ui/home');
  const SystemSetup = require('./system-setup');

  const Tpl = Dom.newTemplate(require('koru/html!./profile'));

  const base = Route.root.addBase(module, Tpl);
  koru.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  var $ = Dom.current;
  var ChangePassword = Tpl.ChangePassword;

  base.addTemplate(module, Tpl.Index, {
    focus: true,
    defaultPage: true,
  });

  base.addTemplate(module, Tpl.ChangePassword, {focus: true});

  Tpl.$helpers({
    systemSetup () {
      var user = $.data();
      if (user && user.isSuperUser()) {
        return Form.pageLink({value: "System setup", template: "SystemSetup"});
      }
    },
  });

  Tpl.$events({
    'click [name=signOut]' (event) {
      Dom.stopEvent();
      UserAccount.logout();
    },

    'click [name=signOutOthers]' (event) {
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
    'click [name=close]' (event) {
      Dom.stopEvent();
      Dialog.close('SignOutOthers');
    },
  });

  Tpl.$extend({
    onBaseEntry () {
      var user = User.me();

      if (! user || user._id === 'guest')
        Route.abortPage(Home);

      document.body.appendChild(Tpl.$autoRender(User.me()));
    },

    onBaseExit () {
      Dom.removeId('Profile');
    },

    $created (ctx) {
      ctx.onDestroy(login.onChange(session, state => {
        state === 'ready' && Route.replacePage(Home);
      }));
    },
  });

  ChangePassword.$events({
    'submit' (event) {
      Dom.stopEvent();
      var form = event.currentTarget;
      var oldPassword = form.querySelector('[name=oldPassword]').value;
      var newPassword = form.querySelector('[name=newPassword]');

      Dom.addClass(form, 'submitting');

      UserAccount.changePassword(User.me().email, oldPassword, newPassword.value, function (error) {
        if (error) {
          Dom.removeClass(form, 'submitting');
          Form.renderError(form, 'oldPassword', 'invalid password.');
        } else {
          Route.history.back();
        }
      });

    },

    'input [name=newPassword],[name=confirm]' (event) {
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
