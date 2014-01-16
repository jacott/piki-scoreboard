var Tpl = Bart.SignIn;
var Dialog = Tpl.Dialog;

Tpl.$helpers({
  item: function () {
    var me = AppModel.User.me();
    if (me)
      return Tpl.Profile.$autoRender(me);
    else
      return Tpl.SignInLink.$autoRender({});
  },
});

Tpl.SignInLink.$events({
  'click': function (event) {
    event.$actioned = true;
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
  'click [name=cancel]': function (event) {
    event.$actioned = true;
    Bart.Dialog.close();
  },
  'click [type=submit]': function (event) {
    event.$actioned = true;
    var button = this;
    var form = document.getElementById('SignInDialog');
    var email = form.querySelector('input[name=email]').value;
    var password = form.querySelector('input[name=password]').value;

    setState(form, 'submit');

    Meteor.loginWithPassword(email,password,function (error) {
      if (error)
        setState(form, 'error');
      else
        Bart.Dialog.close();
    });
  },
});

function setState(form, state) {
  form.className = state;
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
