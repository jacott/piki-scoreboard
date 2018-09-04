define((require, exports, module)=>{
  const koru            = require('koru');
  const format          = require('koru/format');
  const util            = require('koru/util');
  const User            = require('models/user');

  koru.onunload(module, 'reload');

  const RESET_PASSWORD_TEXT = format.compile(
    "Hello {$user.name}\n\n" +
      "To reset your password simply click the link below.\n\n" +
      "{$url}"
  );

  return {
    sendResetPasswordEmailText: (user, resetToken)=> format(RESET_PASSWORD_TEXT, {
      user,
      url: `${koru.config.urlRoot}/#reset-password/${resetToken}`}),
  };
});
