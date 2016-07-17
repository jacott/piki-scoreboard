define(function (require, exports, module) {
  var test, v;
  const session = require('koru/session');
  const TH      = require('test-helper');
  const User    = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test forgotPassword"() {
      test.stub(session, 'rpc');

      User.forgotPassword('email@address', v.stub = test.stub());

      assert.calledWith(session.rpc, 'User.forgotPassword', 'email@address', v.stub);
    },
  });
});
