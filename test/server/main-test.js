(function (test, v) {
  buster.testCase('server/main:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test App.serverReady": function () {
      App.require('App.serverReady', function () {
        v.called = true;
      });

      assert.isTrue(v.called);
    },
  });
})();
