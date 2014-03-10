var Tpl = Bart.SignIn;
var Dialog = Tpl.Dialog;
var ForgotPassword = Tpl.ForgotPassword;
var Form = Bart.Form;

Tpl.$helpers({
  item: function () {
    var me = AppModel.User.me();
    if (me)
      return Tpl.ProfileLink.$autoRender(me);
    else
      return Tpl.SignInLink.$autoRender({});
  },
});

Tpl.SignInLink.$events({
  'click': function (event) {
    Bart.stopEvent();
    Bart.Dialog.open(Dialog.$autoRender({}));
  },
});

App.extend(Tpl, {
  $created: function (ctx, elm) {
    ctx.onDestroy(App.Ready.onReady(whenReady));

    function whenReady(isReady) {
      ctx.updateAllTags();
    }
  },
});


Dialog.$events({
  'click [name=forgot]': function (event) {
    Bart.stopEvent();
    closeDialog();

    Bart.Dialog.open(ForgotPassword.$autoRender({
      email: event.currentTarget.querySelector('[name=email]').value}));
  },

  'click [name=cancel]': closeDialog,

  'click [type=submit]': function (event) {
    Bart.stopEvent();
    var button = this;
    var form = document.getElementById('SignInDialog');
    var email = form.querySelector('input[name=email]').value;
    var password = form.querySelector('input[name=password]').value;

    setState(form, 'submit');

    Meteor.loginWithPassword(email,password,function (error) {
      if (error)
        setState(form, 'error');
      else
        closeDialog();
    });
  },
});

function closeDialog() {
  Bart.Dialog.close();
}

function setState(form, state) {
  Bart.setSuffixClass(form, state, "-state");
  Bart.getCtx('#SignInProgress').updateAllTags({state: state});
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
    Bart.stopEvent();

    AppModel.User.forgotPassword(document.getElementById('email').value, function (error, response) {
      var form = document.getElementById('ForgotPassword');
      Form.clearErrors(form);
      if (error) {
        Form.renderError(form, 'submit', 'An unexpected error occured. Please reload page.');
        form.querySelector('[name=submit]').style.display = 'none';
        App.log('ERROR: ', error.message);
        return;
      }
      if (response.success) {
        var submit = form.querySelector('[name=submit]');

        submit.parentNode.replaceChild(ForgotPassword.EmailSent.$render(), submit);
      } else if (response.email) {
        Form.renderError(form, 'email', AppVal.Error.msgFor(response.email));
      } else {
        Form.renderError(form, 'submit', AppVal.Error.msgFor(response.reason));
      }
    });
  },
});
