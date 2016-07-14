define(function (require, exports, module) {
  var test, v;
  const koru     = require('koru');
  const Event    = require('models/event');
  const Series   = require('models/series');
  const Team     = require('models/team');
  const TH       = require('test-helper');
  const Org      = require('./org');
  const TeamType = require('./team-type');
  const User     = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied"() {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var teamType = TH.Factory.buildTeamType();

        assert.accessDenied(function () {
          teamType.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var teamType = TH.Factory.buildTeamType();

        refute.accessDenied(function () {
          teamType.authorize(v.user._id);
        });
      },

      "test okay to remove"() {
        var teamType = TH.Factory.createTeamType();

        refute.accessDenied(function () {
          teamType.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use with team"() {
        var teamType = TH.Factory.createTeamType();
        TH.Factory.createTeam();

        assert.accessDenied(function () {
          teamType.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use with series"() {
        var teamType = TH.Factory.createTeamType();
        TH.Factory.createSeries({teamType_ids: [teamType._id]});

        assert.accessDenied(function () {
          teamType.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use with event"() {
        var teamType = TH.Factory.createTeamType();
        TH.Factory.createEvent({teamType_ids: [teamType._id]});

        assert.accessDenied(function () {
          teamType.authorize(v.user._id, {remove: true});
        });

      },
    },

  });
});
