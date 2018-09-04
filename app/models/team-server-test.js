define((require, exports, module)=>{
  const koru            = require('koru');
  const Competitor      = require('models/competitor');
  const TH              = require('test-helper');
  const Org             = require('./org');
  const User            = require('./user');

  const {stub, spy, onEnd} = TH;

  const Team = require('./team');

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

        const team = TH.Factory.buildTeam();

        assert.accessDenied(()=>{
          team.authorize(user._id);
        });
      });

      test("allowed", ()=>{
        const team = TH.Factory.buildTeam();

        refute.accessDenied(()=>{
          team.authorize(user._id);
        });
      });

      test("okay to remove", ()=>{
        const team = TH.Factory.createTeam();

        refute.accessDenied(()=>{
          team.authorize(user._id, {remove: true});
        });

      });

      test("remove in use", ()=>{
        const team = TH.Factory.createTeam();
        const competitor = TH.Factory.createCompetitor();

        assert.accessDenied(()=>{
          team.authorize(user._id, {remove: true});
        });

      });
    });

  });
});
