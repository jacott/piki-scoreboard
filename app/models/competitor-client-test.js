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

    "test setTeam"() {
      let team = TH.Factory.createTeam();
      let team2 = TH.Factory.createTeam();
      let tt2 = TH.Factory.createTeamType();
      let team3 = TH.Factory.createTeam();
      let competitor = TH.Factory.createCompetitor({team_ids: null});

      competitor.setTeam(team._id);
      assert.equals(competitor.changes, {team_ids: [team._id]});

      competitor.setTeam(team2);
      assert.equals(competitor.changes, {team_ids: [team2._id]});

      competitor.setTeam(team3);
      assert.equals(competitor.changes, {team_ids: [team2._id, team3._id]});
    },

    "test team"() {
      let competitor = TH.Factory.createCompetitor({team_ids: null});

      assert.same(competitor.team, competitor.climber.team);

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
