define(function(require, exports, module) {
  var util = require('koru/util');
  var User = require('models/user');
  var format = require('koru/format');
  var koru = require('koru');

  koru.onunload(module, 'reload');

  var RESET_PASSWORD_TEXT = format.compile(
    "Hello {$user.name}\n\n" +
      "To reset your password simply click the link below.\n\n" +
      "{$url}"
  );

  return {
    sendResetPasswordEmailText: function(user, resetToken) {
      return format(RESET_PASSWORD_TEXT, {
        user,
        url: `${koru.config.urlRoot}/#reset-password/${resetToken}`});
    }
  };
});
