define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const login           = require('koru/user-account/client-login');
  const util            = require('koru/util');
  const User            = require('models/user');
  const App             = require('./app-base');

  const Tpl = Dom.newTemplate(module, require('koru/html!./sign-in'));
  const $ = Dom.current;
  const ForgotPassword = Tpl.ForgotPassword;

  Route.root.addTemplate(module, Tpl, {
    publicPage: true,
  });

  Tpl.$extend({
    title: 'Sign in',
  });

  const setState = (form, state)=>{
    Dom.setClassBySuffix(state, "-state", form);
    Dom.ctx('#SignInProgress').updateAllTags({state: state});
  };

  Tpl.$events({
    'click [name=forgot]' (event) {
      Dom.stopEvent();

      Dom.tpl.Dialog.open(ForgotPassword.$autoRender({
        email: event.currentTarget.querySelector('[name=email]').value}));
    },

    'click [name=cancel]'() {
      Route.history.back();
    },

    'click [type=submit]' (event) {
      Dom.stopEvent();
      var button = this;
      var form = document.querySelector('#SignIn form');
      var email = form.querySelector('input[name=email]').value;
      var password = form.querySelector('input[name=password]').value;

      setState(form, 'submit');

      UserAccount.loginWithPassword(email,password, error =>{
        if (error)
          setState(form, 'error');
        else
          Route.history.back();
      });
    },
  });

  Tpl.Progress.$helpers({
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
    'click [name=cancel]'() {Dom.tpl.Dialog.close()},

    'submit'(event) {
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
