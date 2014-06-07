define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./reset-password'));
  var util  = require('koru/util');
  var env = require('koru/env');
  var UserAccount = require('koru/user-account');
  var Val = require('koru/model/validation');

  var $ = Dom.current;

  var elm;

  env.onunload(module, function () {
    Route.root.removeTemplate(Tpl);
  });

  Route.root.addTemplate(Tpl, {
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
        Dom.Form.renderError(form, 'newPassword', 'Password too short.');
        return;
      }

      if (password !== form.querySelector('[name=confirm]').value) {
        Dom.Form.renderError(form, 'newPassword', 'Password did not match.');
        return;
      }

      UserAccount.resetPassword($.ctx.data.key, password,
                             callback);

      function callback(error) {
        if (error) {
          if (error.error === 403)
            Dom.Form.renderError(form, 'newPassword', Val.Error.msgFor(error.reason));
          env.error(error.message);
        } else {
          Route.replacePath(Dom.Home);
        }
      }
    },
  });
});
