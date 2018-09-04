define((require, exports, module)=>{
  const Competitor      = require('models/competitor');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Category = require('./category');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let org, user;
    beforeEach(()=>{
      org = Factory.createOrg();
      user = Factory.createUser();
    });

    afterEach(()=>{
      TH.clearDB();
    });

    group("authorize", ()=>{
      test("denied", ()=>{
        const oOrg = Factory.createOrg();
        const oUser = Factory.createUser();

        const category = Factory.buildCategory();

        TH.noInfo();
        assert.accessDenied(()=>{
          category.authorize(user._id);
        });
      });

      test("allowed", ()=>{
        const category = Factory.buildCategory();

        refute.accessDenied(()=>{
          category.authorize(user._id);
        });
      });

      test("okay to remove", ()=>{
        const category = Factory.createCategory();

        refute.accessDenied(()=>{
          category.authorize(user._id, {remove: true});
        });

      });

      test("remove in use", ()=>{
        const category = Factory.createCategory();
        const competitor = Factory.createCompetitor();

        TH.noInfo();
        assert.accessDenied(()=>{
          category.authorize(user._id, {remove: true});
        });

      });
    });
  });
});
