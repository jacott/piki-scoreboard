(function (test, v) {
  buster.testCase('models/client/competitor:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test index": function () {
      var competitor = TH.Factory.createCompetitor();

      assert.equals(AppModel.Competitor.eventIndex({
        event_id: competitor.event_id,
        climber_id: competitor.climber_id}), competitor._id);
    },
  });
})();
