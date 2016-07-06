define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Competitor = require('./competitor');
  var koru = require('koru');
  var Event = require('./event');
  var User = require('./user');
  var Val = require('koru/model/validation');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');

      test.stub(Val, 'ensureString');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oEvent = TH.Factory.createEvent();
        var oUser = TH.Factory.createUser();

        var competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(function () {
          competitor.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        test.spy(Val, 'assertDocChanges');

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

      "test event closed": function () {
        var event = TH.Factory.createEvent({closed: true});
        var competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(function () {
          competitor.authorize(v.user._id);
        });

      },
    },

  });
});
