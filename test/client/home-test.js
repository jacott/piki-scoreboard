(function (test, v) {
  buster.testCase('client/home:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      assert.same(AppRoute.root.defaultPage, Bart.Home);

      AppRoute.gotoPage(Bart.Home);

      assert.dom('#Home');
    },
  });
})();
