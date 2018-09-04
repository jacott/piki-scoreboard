define((require, exports, module)=>{
  const koru            = require('koru');
  const Event           = require('models/event');
  const Series          = require('models/series');
  const Team            = require('models/team');
  const TH              = require('test-helper');
  const Org             = require('./org');
  const User            = require('./user');

  const {stub, spy, onEnd} = TH;

  const TeamType = require('./team-type');

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

        const teamType = TH.Factory.buildTeamType();

        assert.accessDenied(()=>{
          teamType.authorize(user._id);
        });
      });

      test("allowed", ()=>{
        const teamType = TH.Factory.buildTeamType();

        refute.accessDenied(()=>{
          teamType.authorize(user._id);
        });
      });

      test("okay to remove", ()=>{
        const teamType = TH.Factory.createTeamType();

        refute.accessDenied(()=>{
          teamType.authorize(user._id, {remove: true});
        });

      });

      test("remove in use with team", ()=>{
        const teamType = TH.Factory.createTeamType();
        TH.Factory.createTeam();

        assert.accessDenied(()=>{
          teamType.authorize(user._id, {remove: true});
        });

      });

      test("remove in use with series", ()=>{
        const teamType = TH.Factory.createTeamType();
        TH.Factory.createSeries({teamType_ids: [teamType._id]});

        assert.accessDenied(()=>{
          teamType.authorize(user._id, {remove: true});
        });

      });

      test("remove in use with event", ()=>{
        const teamType = TH.Factory.createTeamType();
        TH.Factory.createEvent({teamType_ids: [teamType._id]});

        assert.accessDenied(()=>{
          teamType.authorize(user._id, {remove: true});
        });

      });
    });

  });
});
