define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Competitor = require('./competitor');
  var Category = require('./category');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test creation': function () {
      var competitor=TH.Factory.createCompetitor();

      assert(Competitor.exists(competitor._id));

      assert(competitor.event);
      assert(competitor.climber);
      assert(Category.exists({org_id: competitor.event.org_id, _id: competitor.category_ids[0]}));
    },

  });
});
