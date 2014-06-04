define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Competitor = require('./competitor');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test categoryIdForGroup": function () {
      var aCategories = TH.Factory.createList(3, 'createCategory', function (index, options) {
        options.group = "A";
      });
      var bCategories = TH.Factory.createList(3, 'createCategory', function (index, options) {
        options.group = "B";
      });
      var competitor = TH.Factory.buildCompetitor({category_ids: [aCategories[1]._id, bCategories[2]._id]});

      assert.same(competitor.categoryIdForGroup('A'), aCategories[1]._id);
      assert.same(competitor.categoryIdForGroup('B'), bCategories[2]._id);
      assert.same(competitor.categoryIdForGroup('C'), undefined);
    },

    "test index": function () {
      var competitor = TH.Factory.createCompetitor();

      assert.equals(Competitor.eventIndex({
        event_id: competitor.event_id,
        climber_id: competitor.climber_id}), competitor._id);
    },
  });
});
