(function (test, v) {
  buster.testCase('packages/app-models/test/server/app:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test Fiber": function () {
      assert.same(App.Fiber,  Npm.require('fibers'));
    },

    "test setTimeout, clearTimeout": function () {
      assert.same(App.setTimeout, setTimeout);
      assert.same(App.clearTimeout, clearTimeout);
    },
  });
})();
