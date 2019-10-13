define(function(require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const session         = require('koru/session');
  const Dialog          = require('koru/ui/dialog');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const login           = require('koru/user-account/client-login');
  const User            = require('models/user');
  const Flash           = require('ui/flash');
  const SystemSetup     = require('./system-setup');

  const Tpl = Dom.newTemplate(require('koru/html!./profile'));

  const base = Route.root.addBase(module, Tpl);
  const $ = Dom.current;
  const {ChangePassword} = Tpl;

  base.addTemplate(module, Tpl.Index, {
    focus: true,
    defaultPage: true,
  });

  base.addTemplate(module, Tpl.ChangePassword, {focus: true});

  Tpl.$helpers({
    systemSetup () {
      const user = $.data();
      if (user && user.isSuperUser()) {
        return Form.pageLink({value: "Org settings", template: "SystemSetup"});
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

      const elm = Tpl.SignOutOthers.$autoRender({});

      Dialog.open(elm);

      UserAccount.logoutOtherClients(error =>{
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
    title: "Profile",
    onBaseEntry () {
      const user = User.me();

      if (! user || user._id === 'guest')
        Route.abortPage(Route.root.defaultPage);

      const elm = this.$autoRender(User.me());
      base.childAnchor = elm.querySelector('.body');
      Route.childAnchor.appendChild(elm);
    },

    onBaseExit () {
      Dom.removeId('Profile');
    },

    $created (ctx) {
      ctx.onDestroy(login.onChange(session, state => {
        state === 'ready' && Route.replacePage(Route.root.defaultPage);
      }));
    },
  });

  Tpl.Index.$extend({
    $created(ctx, elm) {
      ctx.data = User.me();
    },
  });

  Tpl.Index.$events({
    'click [type=submit]': Form.submitFunc('UserForm', {
      success() {
        Flash.notice('Profile updated');
        document.activeElement.blur();
        Dom.ctxById('Profile').updateAllTags();
      },
      save(doc) {
        doc.changes.org_id = doc.org_id;

        return doc.$save();
      }
    }),

    'click [name=cancel]'(event) {
      Dom.stopEvent();
      document.activeElement.blur();
      $.ctx.updateAllTags();
    },
  });


  ChangePassword.$events({
    'submit' (event) {
      Dom.stopEvent();
      const form = event.currentTarget;
      const oldPassword = form.querySelector('[name=oldPassword]').value;
      const newPassword = form.querySelector('[name=newPassword]');

      Dom.addClass(form, 'submitting');

      UserAccount.changePassword(User.me().email, oldPassword, newPassword.value, error =>{
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

      const form = event.currentTarget;
      const newPassword = form.querySelector('[name=newPassword]').value;
      const confirm = form.querySelector('[name=confirm]').value;
      const submit = form.querySelector('[type=submit]');

      if (newPassword.length >= 5 && newPassword === confirm)
        submit.removeAttribute('disabled');
      else
        submit.setAttribute('disabled', 'disabled');
    },
  });

  koru.onunload(module, ()=>{Route.root.removeBase(Tpl)});

  return Tpl;
});
