isServer && define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var emailText = require('./email-text');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test sendResetPasswordEmailText": function () {
      var user = TH.Factory.createUser({name: 'Kate Sheppard'});
      var result = emailText.sendResetPasswordEmailText(user._id, 'foo-bar');

      assert.match(result, /Hello Kate Sheppard/);

      assert.match(result, /http:\/\/test.piki\/reset-password\/foo-bar/);
    },

  });
});
