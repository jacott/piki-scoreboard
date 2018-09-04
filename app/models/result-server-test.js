define((require, exports, module)=>{
  const koru            = require('koru');
  const TH              = require('test-helper');
  const Org             = require('./org');
  const User            = require('./user');

  const {stub, spy, onEnd} = TH;

  const Result = require('./result');
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let org, user;
    beforeEach(()=>{
      org = TH.Factory.createOrg();
      user = TH.Factory.createUser();
      stub(koru, 'info');
    });

    afterEach(()=>{
      TH.clearDB();
    });

    group("authorize", ()=>{
      test("denied", ()=>{
        const oOrg = TH.Factory.createOrg();
        const oUser = TH.Factory.createUser();

        const result = TH.Factory.buildResult();

        assert.accessDenied(()=>{
          result.authorize(user._id);
        });
      });

      test("allowed", ()=>{
        const result = TH.Factory.buildResult();

        refute.accessDenied(()=>{
          result.authorize(user._id);
        });
      });

      test("event closed", ()=>{
        const event = TH.Factory.createEvent({closed: true});
        const result = TH.Factory.buildResult();

        assert.accessDenied(()=>{
          result.authorize(user._id);
        });

      });
    });

  });
});
