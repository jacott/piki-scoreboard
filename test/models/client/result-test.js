(function (test, v) {
  buster.testCase('models/client/result:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test index": function () {
      var result = TH.Factory.createResult();

      assert.equals(AppModel.Result.eventCatIndex({
        event_id: result.event_id,
        category_id: result.category_id,
        climber_id: result.climber_id,
      }), result._id);
    },
  });
})();
