define(function (require, exports, module) {
  var test, v;
  const koru   = require('koru');
  const TH     = require('test-helper');
  const Org    = require('./org');
  const Result = require('./result');
  const User   = require('./user');

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

        var result = TH.Factory.buildResult();

        assert.accessDenied(function () {
          result.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var result = TH.Factory.buildResult();

        refute.accessDenied(function () {
          result.authorize(v.user._id);
        });
      },

      "test event closed"() {
        var event = TH.Factory.createEvent({closed: true});
        var result = TH.Factory.buildResult();

        assert.accessDenied(function () {
          result.authorize(v.user._id);
        });

      },
    },

  });
});
