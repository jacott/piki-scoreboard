define((require, exports, module) => {
  const koru            = require('koru');
  const Org             = require('./org');
  const User            = require('./user');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  const Result = require('./result');
  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, user;
    beforeEach(async () => {
      await TH.startTransaction();
      org = await Factory.createOrg();
      user = await Factory.createUser();
      stub(koru, 'info');
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    group('authorize', () => {
      test('denied', async () => {
        const oOrg = await Factory.createOrg();
        const oUser = await Factory.createUser();

        const result = await Factory.buildResult();

        await assert.accessDenied(() => result.authorize(user._id));
      });

      test('allowed', async () => {
        const result = await Factory.buildResult();

        await refute.accessDenied(() => result.authorize(user._id));
      });

      test('event closed', async () => {
        const event = await Factory.createEvent({closed: true});
        const result = await Factory.buildResult();

        await assert.accessDenied(() => result.authorize(user._id));
      });
    });
  });
});
