define(function(require, exports, module) {
  const koru        = require('koru');
  require('koru/server');
  const UserAccount = require('koru/user-account');
  require('models/reg-upload-server');
  require('publish/publish-event');
  require('publish/publish-org');
  require('publish/publish-self');


  koru.onunload(module, 'reload'); // FIXME maybe close all client connections instead

  var emailConfig = koru.config.userAccount.emailConfig;
  emailConfig.sendResetPasswordEmailText = function(user, resetToken) {
    return require('server/email-text').sendResetPasswordEmailText(user, resetToken);
  };

  return function () {
    require('koru/email').initPool(koru.config.mailUrl);
    UserAccount.init();
  };
});
