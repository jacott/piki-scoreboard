define((require, exports, module) => {
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Competitor = require('./competitor');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());

    afterEach(() => TH.rollbackTransaction());

    test('setTeam', () => {
      let tt1 = Factory.createTeamType();
      let team = Factory.createTeam();
      let team2 = Factory.createTeam();
      let tt2 = Factory.createTeamType();
      let team3 = Factory.createTeam();
      let competitor = Factory.createCompetitor({team_ids: null});

      competitor.setTeam(tt1._id, team._id);
      assert.equals(competitor.changes, {team_ids: [team._id]});

      competitor.setTeam(tt1._id, team2._id);
      assert.equals(competitor.changes, {team_ids: [team2._id]});

      competitor.setTeam(tt2._id, team3._id);
      assert.equals(competitor.changes, {team_ids: [team2._id, team3._id]});

      competitor.setTeam(tt2._id, null);
      assert.equals(competitor.changes, {team_ids: [team2._id]});
    });

    test('team', () => {
      let tt1 = Factory.createTeamType();
      let t1 = Factory.createTeam();
      let competitor = Factory.createCompetitor({team_ids: [t1._id]});

      assert.same(competitor.getTeam('foo'), undefined);
      assert.same(competitor.getTeam(tt1), t1);
    });

    test('categoryIdForGroup', () => {
      const aCategories = Factory.createList(3, 'createCategory', function (index, options) {
        options.group = 'A';
      });
      const bCategories = Factory.createList(3, 'createCategory', function (index, options) {
        options.group = 'B';
      });
      const competitor = Factory.buildCompetitor({
        category_ids: [aCategories[1]._id, bCategories[2]._id]});

      assert.same(competitor.categoryIdForGroup('A'), aCategories[1]._id);
      assert.same(competitor.categoryIdForGroup('B'), bCategories[2]._id);
      assert.same(competitor.categoryIdForGroup('C'), undefined);
    });

    test('test index', () => {
      const competitor = Factory.createCompetitor();

      assert.equals(Competitor.eventIndex.lookup({
        event_id: competitor.event_id,
        climber_id: competitor.climber_id}), competitor._id);
    });
  });
});
