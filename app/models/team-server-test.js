define(function (require, exports, module) {
  var test, v;
  const koru       = require('koru');
  const Competitor = require('models/competitor');
  const TH         = require('test-helper');
  const Org        = require('./org');
  const Team       = require('./team');
  const User       = require('./user');

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

        var team = TH.Factory.buildTeam();

        assert.accessDenied(function () {
          team.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var team = TH.Factory.buildTeam();

        refute.accessDenied(function () {
          team.authorize(v.user._id);
        });
      },

      "test okay to remove"() {
        var team = TH.Factory.createTeam();

        refute.accessDenied(function () {
          team.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use"() {
        var team = TH.Factory.createTeam();
        var competitor = TH.Factory.createCompetitor();

        assert.accessDenied(function () {
          team.authorize(v.user._id, {remove: true});
        });

      },
    },

  });
});
