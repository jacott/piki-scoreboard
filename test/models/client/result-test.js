(function (test, v) {
  buster.testCase('models/client/result:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test setScore": function () {
      var result = TH.Factory.createResult({scores: [1]});

      test.stub(App, 'rpc');

      result.setScore(1, '23.5+');

      assert.calledWith(App.rpc, 'Result.setScore', result._id, 1, '23.5+');
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
