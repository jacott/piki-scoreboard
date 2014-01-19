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

      assert.dom('#Home', function () {
        assert.dom('button.link', 'Clubs', function () {
          TH.click(this);
        });
      });

      assert.dom('#Club');
    },

    "test climbers link": function () {
      AppRoute.gotoPage(Bart.Home);
      TH.click('button.link', 'Climbers');

      assert.dom('#Climber');
    },
  });
})();
