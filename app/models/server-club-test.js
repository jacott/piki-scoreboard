define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Club = require('./club');
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

        var club = TH.Factory.buildClub();

        assert.accessDenied(function () {
          club.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var club = TH.Factory.buildClub();

        refute.accessDenied(function () {
          club.authorize(v.user._id);
        });
      },
    },
  });
});
