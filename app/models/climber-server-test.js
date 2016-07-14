define(function (require, exports, module) {
  var test, v;
  const koru    = require('koru');
  const TH      = require('test-helper');
  const Climber = require('./climber');
  const Org     = require('./org');
  const Result  = require('./result');
  const User    = require('./user');

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

        var climber = TH.Factory.buildClimber();

        assert.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var climber = TH.Factory.buildClimber();

        refute.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },

      "test okay to remove"() {
        var climber = TH.Factory.createClimber();

        refute.accessDenied(function () {
          climber.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use"() {
        var climber = TH.Factory.createClimber();
        var competitor = TH.Factory.createCompetitor();

        assert.accessDenied(function () {
          climber.authorize(v.user._id, {remove: true});
        });

      },
    },

  });
});
