define(function(require, exports, module) {
  var Dom    = require('koru/dom');
  var Route = require('koru/ui/route');
  var Form = require('koru/ui/form');
  var App = require('app');
  var User = require('models/user');
  var Val = require('koru/model/validation');
  var UserAccount = require('koru/user-account/client-main');
  var util = require('koru/util');
  var env = require('koru/env');

  var Tpl = Dom.newTemplate(require('koru/html!./sign-in'));
  var ForgotPassword = Tpl.ForgotPassword;
  var Dialog = Tpl.Dialog;

  var $ = Dom.current;


  Tpl.$helpers({
    item: function () {
      var me = App.me();
      if (me && me.role !== 'g')
        return Tpl.ProfileLink.$autoRender(me);
      else
        return Tpl.SignInLink.$autoRender({});
    },
  });

  Tpl.SignInLink.$events({
    'click': function (event) {
      Dom.stopEvent();
      Dom.Dialog.open(Dialog.$autoRender({}));
    },
  });

  util.extend(Tpl, {
    $created: function (ctx, elm) {
      ctx.onDestroy(UserAccount.onChange(userChange));

      function userChange(state) {
        state === 'ready' && ctx.updateAllTags();
      }
    },
  });


  Dialog.$events({
    'click [name=forgot]': function (event) {
      Dom.stopEvent();
      closeDialog();

      Dom.Dialog.open(ForgotPassword.$autoRender({
        email: event.currentTarget.querySelector('[name=email]').value}));
    },

    'click [name=cancel]': closeDialog,

    'click [type=submit]': function (event) {
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
    message: function () {
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
    'submit': function (event) {
      Dom.stopEvent();

      User.forgotPassword(document.getElementById('email').value, function (error, response) {
        var form = document.getElementById('ForgotPassword');
        Form.clearErrors(form);
        if (error) {
          Form.renderError(form, 'submit', 'An unexpected error occured. Please reload page.');
          form.querySelector('[name=submit]').style.display = 'none';
          env.error(error.message);
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
