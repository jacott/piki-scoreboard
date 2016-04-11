define(function(require, exports, module) {
  const koru          = require('koru');
  const Dom           = require('koru/dom');
  const Val           = require('koru/model/validation');
  const session       = require('koru/session');
  const Form          = require('koru/ui/form');
  const Route         = require('koru/ui/route');
  const UserAccount   = require('koru/user-account');
  const login         = require('koru/user-account/client-login');
  const util          = require('koru/util');
  const User          = require('models/user');
  const App           = require('./app-base');

  const Tpl = Dom.newTemplate(require('koru/html!./sign-in'));
  const $ = Dom.current;
  const ForgotPassword = Tpl.ForgotPassword;
  const Dialog = Tpl.Dialog;


  Tpl.$helpers({
    item () {
      if (this && this.role !== 'g')
        return Tpl.ProfileLink.$autoRender(this);
      else
        return Tpl.SignInLink.$autoRender({});
    },
  });

  Tpl.SignInLink.$events({
    'click' (event) {
      Dom.stopEvent();
      Dom.Dialog.open(Dialog.$autoRender({}));
    },
  });

  util.extend(Tpl, {
    $created (ctx, elm) {
      var userOb;
      ctx.onDestroy(login.onChange(session, state => {
        if (state !== 'ready') return;
        observeUserId();
      }));

      ctx.onDestroy(function () {
        userOb && userOb.stop();
        userOb = null;
      });

      observeUserId();

      function observeUserId() {
        userOb && userOb.stop();
        if (koru.userId())
          userOb = User.observeId(koru.userId(), userChange);

        userChange(User.me());
      }

      function userChange(doc) {
        App.setAccess();
        ctx.updateAllTags(doc || {});
      }
    },
  });


  Dialog.$events({
    'click [name=forgot]' (event) {
      Dom.stopEvent();
      closeDialog();

      Dom.Dialog.open(ForgotPassword.$autoRender({
        email: event.currentTarget.querySelector('[name=email]').value}));
    },

    'click [name=cancel]': closeDialog,

    'click [type=submit]' (event) {
      Dom.stopEvent();
      var button = this;
      var form = document.getElementById('SignInDialog');
      var email = form.querySelector('input[name=email]').value;
      var password = form.querySelector('input[name=password]').value;

      setState(form, 'submit');

      UserAccount.loginWithPassword(email,password,function (error) {
        if (error)
          setState(form, 'error');
        else
          closeDialog();
      });
    },
  });

  function closeDialog() {
    Dom.Dialog.close();
  }

  function setState(form, state) {
    Dom.setClassBySuffix(state, "-state", form);
    Dom.getCtx('#SignInProgress').updateAllTags({state: state});
  }

  Dialog.Progress.$helpers({
    message () {
      switch(this.state) {
      case 'submit':
        return 'Signing in...';
      case 'error':
        return 'Invalid email or password';
      default:
        return '';
      }
    },
  });

  ForgotPassword.$events({
    'click [name=cancel]': function () {
      closeDialog();
    },
    'submit' (event) {
      Dom.stopEvent();

      User.forgotPassword(document.getElementById('email').value, function (error, response) {
        var form = document.getElementById('ForgotPassword');
        Form.clearErrors(form);
        if (error) {
          Form.renderError(form, 'submit', 'An unexpected error occured. Please reload page.');
          form.querySelector('[name=submit]').style.display = 'none';
          koru.error(error.message);
          return;
        }
        if (response.success) {
          var submit = form.querySelector('[name=submit]');

          submit.parentNode.replaceChild(ForgotPassword.EmailSent.$render(), submit);
        } else if (response.email) {
          Form.renderError(form, 'email', Val.Error.msgFor(response.email));
        } else {
          Form.renderError(form, 'submit', Val.Error.msgFor(response.reason));
        }
      });
    },
  });

  return Tpl;
});
