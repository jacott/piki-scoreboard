define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./reset-password'));
  var util  = require('koru/util');
  var koru = require('koru');
  var UserAccount = require('koru/user-account');
  var Val = require('koru/model/validation');
  var Form = require('koru/ui/form');

  var $ = Dom.current;

  var elm;

  koru.onunload(module, function () {
    Route.root.removeTemplate(Tpl);
  });

  Route.root.addTemplate(module, Tpl, {
    data: function (page, pageRoute) {
      return {key: pageRoute.append};
    }
  });


  Tpl.$events({
    'submit form': function (event) {
      Dom.stopEvent();

      var form = this;

      var password = form.querySelector('[name=newPassword]').value;

      if (password.length < 4) {
        Form.renderError(form, 'newPassword', 'Password too short.');
        return;
      }

      if (password !== form.querySelector('[name=confirm]').value) {
        Form.renderError(form, 'newPassword', 'Password did not match.');
        return;
      }

      UserAccount.resetPassword($.ctx.data.key, password,
                             callback);

      function callback(error) {
        if (error) {
          if (error.error === 403)
            Form.renderError(form, 'newPassword', Val.Error.msgFor(error.reason));
          koru.error(error.message);
        } else {
          Route.replacePath(Route.root.defaultPage);
        }
      }
    },
  });

  return Tpl;
});
