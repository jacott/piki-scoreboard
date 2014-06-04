define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Event = require('./event');
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

        var event = TH.Factory.buildEvent();

        assert.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var event = TH.Factory.buildEvent();

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },
    },
  });
});
