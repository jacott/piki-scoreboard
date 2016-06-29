define(function (require, exports, module) {
  var test, v;
  const Team       = require('models/team');
  const TH         = require('test-helper');
  const Category   = require('./category');
  const Competitor = require('./competitor');

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
      var team = TH.Factory.createTeam();
      var competitor=TH.Factory.createCompetitor();

      assert(Competitor.exists(competitor._id));

      assert(competitor.event);
      assert(competitor.climber);
      assert.equals(competitor.team_ids, [team._id]);
      assert(Category.exists({org_id: competitor.event.org_id, _id: competitor.category_ids[0]}));
    },

  });
});
