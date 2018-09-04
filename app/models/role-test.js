isServer && define((require, exports, module)=>{
  const Org             = require('models/org');
  const User            = require('models/user');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Role = require('./role');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("persistence", ()=>{
      const org = Factory.createOrg();
      const user = Factory.createUser();
      const doc = Factory.last.role;

      const loaded = doc.$reload(true); // true avoids cache
      assert.same(Role.query.count(), 1);
      assert.equals(loaded.org_id, org._id);
      assert.equals(loaded.user_id, user._id);
      assert.equals(loaded.role, doc.role);
      assert.equals(loaded.role, 'a');
    });
  });
});
