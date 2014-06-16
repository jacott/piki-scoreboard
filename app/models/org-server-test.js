define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Org = require('./org');
  var User = require('./user');
  var koru = require('koru');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },
    "test authorize": function () {
      var org = TH.Factory.createOrg();
      var user = TH.Factory.createUser('su');

      refute.accessDenied(function () {
        org.authorize(user._id);
      });

      user = TH.Factory.createUser();

      test.stub(koru, 'info');

      assert.accessDenied(function () {
        org.authorize(user._id);
      });
    },
  });
});
