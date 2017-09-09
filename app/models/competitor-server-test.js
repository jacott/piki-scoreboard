define(function (require, exports, module) {
  const koru       = require('koru');
  const Val        = require('koru/model/validation');
  const TH         = require('test-helper');
  const Competitor = require('./competitor');
  const Event      = require('./event');
  const User       = require('./user');

  const {stub, spy} = TH;

  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser();
      stub(koru, 'info');

      stub(Val, 'ensureString');
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied"() {
        var oOrg = TH.Factory.createOrg();
        var oEvent = TH.Factory.createEvent();
        var oUser = TH.Factory.createUser();

        var competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(function () {
          competitor.authorize(v.user._id);
        });
      },

      "test allowed"() {
        spy(Val, 'assertDocChanges');

        var competitor = TH.Factory.buildCompetitor({number: 123});

        refute.accessDenied(function () {
          competitor.authorize(v.user._id);
        });

        assert.calledWith(Val.ensureString, v.event._id);
        assert.calledWith(Val.assertDocChanges, TH.matchModel(competitor),
                          {category_ids: ['id'],
                           team_ids: ['id'],
                           number: 'integer'},
                          {_id: 'id',
                           event_id: 'id',
                           climber_id: 'id',
                          });
      },

      "test event closed"() {
        var event = TH.Factory.createEvent({closed: true});
        var competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(function () {
          competitor.authorize(v.user._id);
        });

      },
    },

  });
});
