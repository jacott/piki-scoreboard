define((require, exports, module)=>{
  const koru            = require('koru');
  require('koru/server');
  const UserAccount     = require('koru/user-account');
  const Ranking         = require('models/ranking');
  require('models/reg-upload-server');
  require('publish/publish-event-server');
  require('publish/publish-org-server');
  require('publish/publish-self-server');


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
    UserAccount.init();
  };
});
