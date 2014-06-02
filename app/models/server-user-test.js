define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var User = require('./server-user');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test guestUser": function () {
      var guest = User.guestUser();
      assert.equals(guest._id, 'guest');
      assert.equals(guest.role, 'g');

      assert.equals(guest.attributes, User.guestUser().attributes);
    },

  });
});
