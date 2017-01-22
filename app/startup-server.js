define(function(require, exports, module) {
  const koru        = require('koru');
  require('koru/server');
  const UserAccount = require('koru/user-account');
  const Ranking     = require('models/ranking');
  require('models/reg-upload-server');
  require('publish/publish-event');
  require('publish/publish-org');
  require('publish/publish-self');


  koru.onunload(module, restart);

  const emailConfig = koru.config.userAccount.emailConfig;
  emailConfig.sendResetPasswordEmailText = function(user, resetToken) {
    return require('server/email-text').sendResetPasswordEmailText(user, resetToken);
  };

  function restart(mod, error) {
    if (error) return;
    const modId = mod.id;
    setTimeout(function () {
      require(modId, function (sc) {
        sc.start && sc.start();
      });
    });
  }

  return function () {
    require('koru/email').initPool(koru.config.mailUrl);
    UserAccount.init();
  };
});
