isServer && define((require, exports, module) => {
  const TH              = require('koru/model/test-db-helper');
  const Org             = require('models/org');
  const User            = require('models/user');
  const Factory         = require('test/factory');

  const Role = require('./role');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(async () => {
      await TH.startTransaction();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    test('persistence', async () => {
      const org = await Factory.createOrg();
      const user = await Factory.createUser();
      const doc = Factory.last.role;

      const loaded = await doc.$reload(true); // true avoids cache
      assert.same(await Role.query.count(), 1);
      assert.equals(loaded.org_id, org._id);
      assert.equals(loaded.user_id, user._id);
      assert.equals(loaded.role, doc.role);
      assert.equals(loaded.role, 'a');
    });
  });
});
