define((require, exports, module) => {
  'use strict';
  const STH             = require('koru/startup-server-test-helper');
  const TH              = require('koru/test-helper');

  const {stub} = TH;

  TH.testCase(module, ({test}) => {
    test('run', async () => {
      const {mockRequire, init, startFunction, mockModule, exports} = STH(module);

      const emailConfig = {};
      const koru = mockRequire('koru', {config: {userAccount: {emailConfig}, mailUrl: 'the_mailUrl'}});
      const Email = mockRequire('koru/email', {initPool: stub()});
      const StackErrorConvert = mockRequire('koru/stack-error-convert', {start: stub()});
      const UserAccount = mockRequire('koru/user-account', {start: stub()});
      const KoruStartup = mockRequire('koru/startup-server', {restartOnUnload: stub()});
      const ClimberRanking = mockRequire('models/climber-ranking');
      const Ranking = mockRequire('models/ranking');
      const RegUploadServer = mockRequire('models/reg-upload-server');
      const EventPub = mockRequire('pubsub/event-pub');
      const OrgPub = mockRequire('pubsub/org-pub');
      const SelfPub = mockRequire('pubsub/self-pub');
      const Export = mockRequire('server/export');

      await init();

      const sendResetPasswordEmailText = stub().returns('email reset');
      exports['server/email-text'] = {sendResetPasswordEmailText};

      assert.calledWith(KoruStartup.restartOnUnload, mockRequire, mockModule);
      assert.calledWith(Email.initPool, 'the_mailUrl');
      assert.equals(emailConfig.sendResetPasswordEmailText('user123', 'token123'), 'email reset');

      assert.calledWith(sendResetPasswordEmailText, 'user123', 'token123');

      const start = startFunction();

      refute.called(UserAccount.start);

      const p = start();

      await p;

      assert.called(UserAccount.start);
    });
  });
});
