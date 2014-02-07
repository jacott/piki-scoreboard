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
      test.stub(Meteor, 'call');

      AppModel.User.forgotPassword('foo@bar.com', 'callback');

      assert.calledWith(Meteor.call, 'User.forgotPassword', 'foo@bar.com', 'callback');
    },
  });
})();
