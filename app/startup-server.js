const fs = require('node:fs');

define((require, exports, module) => {
  const koru            = require('koru');
  const Email           = require('koru/email');
  const StackErrorConvert = require('koru/stack-error-convert');
  const KoruStartup     = require('koru/startup-server');
  const UserAccount     = require('koru/user-account');
  const ClimberRanking  = require('models/climber-ranking');
  const Ranking         = require('models/ranking');
  const RegUploadServer = require('models/reg-upload-server');
  const EventPub        = require('pubsub/event-pub');
  const OrgPub          = require('pubsub/org-pub');
  const SelfPub         = require('pubsub/self-pub');
  const Export          = require('server/export');

  KoruStartup.restartOnUnload(require, module);

  if (process.env.KORU_APP_VERSION !== undefined) {
    console.log(`KORU_APP_VERSION = ` + process.env.KORU_APP_VERSION);
  }

  const findSourceMap = () => {
    try {
      fs.accessSync('./index.js.amp');
      return '.';
    } catch (err) {
      return '../build';
    }
  };

  StackErrorConvert.start({sourceMapDir: findSourceMap()});

  const {emailConfig} = koru.config.userAccount;
  emailConfig.sendResetPasswordEmailText = (user, resetToken) => require('server/email-text')
    .sendResetPasswordEmailText(user, resetToken);

  Email.initPool(koru.config.mailUrl || undefined);

  const StartupServer = async () => {
    UserAccount.start();
  };

  return StartupServer;
});
