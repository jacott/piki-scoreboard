define((require, exports, module) => {
  const TH              = require('koru/model/test-db-helper');
  const UserAccount     = require('koru/user-account');
  const Competitor      = require('models/competitor');
  const Factory         = require('test/factory');

  const Category = require('./category');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, user;
    beforeEach(async () => {
      UserAccount.sendResetPasswordEmail = async () => {};

      await TH.startTransaction();
      org = await Factory.createOrg();
      user = await Factory.createUser();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    group('authorize', () => {
      test('denied', async () => {
        const oOrg = await Factory.createOrg();
        const oUser = await Factory.createUser();

        const category = await Factory.buildCategory();

        TH.noInfo();
        await assert.accessDenied(() => category.authorize(user._id));
      });

      test('allowed', async () => {
        const category = await Factory.buildCategory();

        await refute.accessDenied(() => category.authorize(user._id));
      });

      test('okay to remove', async () => {
        const category = await Factory.createCategory();

        await refute.accessDenied(() => category.authorize(user._id, {remove: true}));
      });

      test('remove in use', async () => {
        const category = await Factory.createCategory();
        const competitor = await Factory.createCompetitor();

        TH.noInfo();
        await assert.accessDenied(() => category.authorize(user._id, {remove: true}));
      });
    });
  });
});
