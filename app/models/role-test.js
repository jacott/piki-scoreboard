isServer && define(function (require, exports, module) {
  const TH              = require('koru/model/test-db-helper');
  const Org             = require('models/org');
  const User            = require('models/user');
  const Factory         = require('test/factory');

  const Role = require('./role');
  let v = null;

  TH.testCase(module, {
    setUp() {
      TH.startTransaction();
      v = {};
    },

    tearDown() {
      v = null;
      TH.endTransaction();
    },

    "test persistence"() {
      const org = Factory.createOrg();
      const user = Factory.createUser();
      const doc = Factory.last.role;

      const loaded = doc.$reload(true); // true avoids cache
      assert.same(Role.query.count(), 1);
      assert.equals(loaded.org_id, org._id);
      assert.equals(loaded.user_id, user._id);
      assert.equals(loaded.role, doc.role);
      assert.equals(loaded.role, 'a');
    },
  });
});
