define((require, exports, module)=>{
  const TH              = require('test-helper');
  const User            = require('./user');

  const {stub, spy, onEnd} = TH;

  const Org = require('./org');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });
    test("authorize", ()=>{
      var org = TH.Factory.createOrg();
      var user = TH.Factory.createUser('su');

      refute.accessDenied(()=>{
        org.authorize(user._id);
      });

      user = TH.Factory.createUser();

      TH.noInfo();

      assert.accessDenied(()=>{
        org.authorize(user._id);
      });
    });
  });
});
