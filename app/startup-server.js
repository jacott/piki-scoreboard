define(function(require, exports, module) {
  require('koru/server');
  var koru = require('koru');
  require('publish/publish-self');
  require('publish/publish-org');
  require('publish/publish-event');
  require('models/reg-upload-server');

  koru.onunload(module, 'reload'); // FIXME maybe close all client connections instead

  var emailConfig = koru.config.userAccount.emailConfig;
  emailConfig.sendResetPasswordEmailText = function(userId, resetToken) {
    return require('server/email-text').sendResetPasswordEmailText(userId, resetToken);
  };

  return function () {
    require('koru/email').initPool(koru.config.mailUrl);
  };
});
