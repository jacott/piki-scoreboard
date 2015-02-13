define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Result = require('./result');
  var Org = require('./org');
  var User = require('./user');
  var koru = require('koru');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var result = TH.Factory.buildResult();

        assert.accessDenied(function () {
          result.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var result = TH.Factory.buildResult();

        refute.accessDenied(function () {
          result.authorize(v.user._id);
        });
      },

      "test event closed": function () {
        var event = TH.Factory.createEvent({closed: true});
        var result = TH.Factory.buildResult();

        assert.accessDenied(function () {
          result.authorize(v.user._id);
        });

      },
    },

  });
});
