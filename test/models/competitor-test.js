(function (test, v) {
  buster.testCase('models/competitor:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test creation': function () {
      var competitor=TH.Factory.createCompetitor();

      assert(AppModel.Competitor.exists(competitor._id));

      assert(competitor.event);
      assert(competitor.climber);
      assert(AppModel.Category.exists({org_id: competitor.event.org_id, _id: competitor.category_ids[0]}));
    },
  });
})();
