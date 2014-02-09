(function (test, v) {
  buster.testCase('models/result:', {
    setUp: function () {
      test = this;
      v = {};
      v.categories = TH.Factory.
            createList(3, 'createCategory', function (index, options) {
              options.heats = [
                {id: '1'+index, name: 'heat 1' + index},
                {id: '2'+index, name: 'heat 2' + index},
              ];
            });
      v.catIds = Apputil.mapField(v.categories);

      v.competitor = TH.Factory.buildCompetitor({category_ids: v.catIds});
      v.competitor.$$save();
    },

    tearDown: function () {
      v = null;
    },

    "test associated": function () {
      var result = TH.Factory.createResult();

      assert(result.climber);
      assert(result.category);
      assert(result.event);
    },

    "test created when competitor registered": function () {
      assert(v.r2 = AppModel.Result.findOne({category_id: v.categories[0]._id}));
      v.result = AppModel.Result.findOne({category_id: v.categories[1]._id});
      assert(v.result);

      assert.same(v.result.event_id, v.competitor.event_id);
      assert.same(v.result.climber_id, v.competitor.climber_id);
      assert.between(v.result.scores[0], 0, 1);
      refute.same(v.r2.scores[0], v.result.scores[0]);
    },

    "test deleted when competitor cat removed": function () {
      v.competitor.category_ids = v.catIds.slice(1);
      v.competitor.$$save();

      assert.same(AppModel.Result.find({category_id: v.categories[0]._id}).count(), 0);
      assert.same(AppModel.Result.find({category_id: v.categories[1]._id}).count(), 1);
      assert.same(AppModel.Result.find({category_id: v.categories[2]._id}).count(), 1);
    },

    "test all deleted when competitor deregistered": function () {
      v.competitor.$remove();

      assert.same(AppModel.Result.find().count(), 0);
    },
  });
})();
