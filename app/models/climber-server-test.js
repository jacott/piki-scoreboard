define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Climber = require('./climber');
  var Org = require('./org');
  var User = require('./user');
  var env = require('koru/env');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
      test.stub(env, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var climber = TH.Factory.buildClimber();

        assert.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var climber = TH.Factory.buildClimber();

        refute.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },
    },

  });
});
