var $ = Bart.current;
var Tpl = Bart.ResetPassword;

AppRoute.root.addTemplate(Tpl, {
  data: function (page, pageRoute) {
    return {key: pageRoute.append};
  }
});


Tpl.$events({
  'submit form': function (event) {
    event.$actioned = true;

    var form = this;

    var password = form.querySelector('[name=newPassword]').value;

    if (password.length < 4) {
      Bart.Form.renderError(form, 'newPassword', 'Password too short.');
      return;
    }

    if (password !== form.querySelector('[name=confirm]').value) {
      Bart.Form.renderError(form, 'newPassword', 'Password did not match.');
      return;
    }

    Accounts.resetPassword($.ctx.data.key, password,
                           callback);

    function callback(error) {
      if (error) {
        if (error.error === 403)
          Bart.Form.renderError(form, 'newPassword', AppVal.Error.msgFor(error.reason));
        App.log('ERROR ', error.message);
      } else {
        AppRoute.replacePath(Bart.Home);
      }
    }
  },
});
