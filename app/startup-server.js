define((require, exports, module)=>{
  const koru            = require('koru');
  require('koru/server');
  const StackErrorConvert = require('koru/stack-error-convert');
  const UserAccount     = require('koru/user-account');
  const ClimberRanking  = require('models/climber-ranking');
  const Ranking         = require('models/ranking');
  const EventPub        = require('pubsub/event-pub');
  const OrgPub          = require('pubsub/org-pub');
  const SelfPub         = require('pubsub/self-pub');
  const Export          = require('server/export');

  require('models/reg-upload-server');

  console.log(`org-node KORU_APP_VERSION = `+process.env.KORU_APP_VERSION);
  if (process.env.KORU_APP_VERSION !== void 0) {
    StackErrorConvert.start({sourceMapDir: '../build'});
  }

  const emailConfig = koru.config.userAccount.emailConfig;
  emailConfig.sendResetPasswordEmailText = (user, resetToken)=> require('server/email-text')
    .sendResetPasswordEmailText(user, resetToken);

  module.onUnload((mod, error)=>{
    if (error) return;
    const modId = mod.id;
    setTimeout(()=>{
      require(modId, sc =>{sc.start && sc.start()});
    });
  });


  return ()=>{
    require('koru/email').initPool(koru.config.mailUrl);
    UserAccount.start();
  };
});
