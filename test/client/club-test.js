(function (test, v) {
  buster.testCase('client/club:', {
    setUp: function () {
      test = this;
      v = {};
      AppRoute.gotoPage(Bart.Club.Index);
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      assert.dom('#Club', function () {
        assert.dom('[name=addClub]', 'Add new club');
      });
    },

    "test adding new club": function () {
      assert.dom('#Club', function () {
        TH.click('[name=addClub]');
        assert.dom('#AddClub');
      });
    },
  });
})();
