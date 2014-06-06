define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var session = require('koru/session');
  var User = require('./user');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test forgotPassword": function () {
      test.stub(session, 'rpc');

      User.forgotPassword('email@address', v.stub = test.stub());

      assert.calledWith(session.rpc, 'User.forgotPassword', 'email@address', v.stub);
    },
  });
});
