define((require, exports, module) => {
  const User            = require('./user');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  const Org = require('./org');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('authorize', async () => {
      var org = await Factory.createOrg();
      var user = await Factory.createUser('su');

      await refute.accessDenied(() => org.authorize(user._id));

      user = await Factory.createUser();

      TH.noInfo();

      await assert.accessDenied(() => org.authorize(user._id));
    });
  });
});
