define((require, exports, module)=>{
  const Val             = require('koru/model/validation');
  const TH              = require('test-helper');
  const Competitor      = require('./competitor');
  const Event           = require('./event');
  const User            = require('./user');

  const {stub, spy} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let event, user;
    beforeEach(()=>{
      event = TH.Factory.createEvent();
      user = TH.Factory.createUser();
      TH.noInfo();

      stub(Val, 'ensureString');
    });

    afterEach(()=>{
      TH.clearDB();
    });

    group("authorize", ()=>{
      test("denied", ()=>{
        const oOrg = TH.Factory.createOrg();
        const oEvent = TH.Factory.createEvent();
        const oUser = TH.Factory.createUser();

        const competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(()=>{competitor.authorize(user._id)});
      });

      test("allowed", ()=>{
        spy(Val, 'assertDocChanges');

        const competitor = TH.Factory.buildCompetitor({number: 123});

        refute.accessDenied(()=>{
          competitor.authorize(user._id);
        });

        assert.calledWith(Val.ensureString, event._id);
        assert.calledWith(Val.assertDocChanges, TH.matchModel(competitor), {
          category_ids: ['id'],
          team_ids: ['id'],
          number: 'integer'
        }, {
          _id: 'id',
          event_id: 'id',
          climber_id: 'id',
        });
      });

      test("event closed", ()=>{
        const event = TH.Factory.createEvent({closed: true});
        const competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(()=>{competitor.authorize(user._id)});
      });
    });
  });
});
