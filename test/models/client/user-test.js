(function (test, v) {
  buster.testCase('models/client/user:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test forgotPassword": function () {
      test.stub(App, 'rpc');

      AppModel.User.forgotPassword('foo@bar.com', 'callback');

      assert.calledWith(App.rpc, 'User.forgotPassword', 'foo@bar.com', 'callback');
    },
  });
})();
