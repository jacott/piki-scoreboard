define((require, exports, module) => {
  const Category        = require('models/category');
  const Competitor      = require('models/competitor');
  const Event           = require('models/event');
  const Result          = require('models/result');
  const Team            = require('models/team');
  const TeamType        = require('models/team-type');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const sut = require('./ranking');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('Team score simple', async () => {
      let tt1 = await Factory.createTeamType({_id: 'tt1'});
      let team1 = await Factory.createTeam({_id: 'team1'});
      let team2 = await Factory.createTeam({_id: 'team2'});
      let tt2 = await Factory.createTeamType({_id: 'tt2'});
      let team3 = await Factory.createTeam({_id: 'team3'});
      let cat1 = await Factory.createCategory({_id: 'cat1'});
      let cat2 = await Factory.createCategory({_id: 'cat2'});

      let event = await Factory.createEvent({
        teamType_ids: [tt1._id, tt2._id],
        heats: {cat1: cat1.heatFormat, cat2: cat2.heatFormat},
      });
      let compet1 = await Factory.createCompetitor({
        team_ids: [team1._id, team3._id], category_ids: [cat1._id, cat2._id]});
      let compet2 = await Factory.createCompetitor({
        team_ids: [team2._id], category_ids: [cat1._id]});
      let compet3 = await Factory.createCompetitor({
        team_ids: [team1._id, team3._id]});
      let compet4 = await Factory.createCompetitor({
        team_ids: null});

      await Factory.createResult({competitor_id: compet1._id, category_id: cat1._id,
                                  scores: [0.1, 100]});
      await Factory.createResult({competitor_id: compet1._id, category_id: cat2._id,
                                  scores: [0.2, 100]});
      await Factory.createResult({competitor_id: compet2._id, category_id: cat2._id,
                                  scores: [0.5, 500]});
      await Factory.createResult({competitor_id: compet3._id, category_id: cat1._id,
                                  scores: [0.7, 500]});
      await Factory.createResult({competitor_id: compet4._id, category_id: cat1._id,
                                  scores: [0.3, 700]});

      assert.equals(await sut.getTeamScores(event), {tt1: {team1: 225, team2: 100}, tt2: {team3: 225}});
    });

    test('not started', async () => {
      let tt = await Factory.createTeamType({_id: 'tt1'});
      let team = await Factory.createTeam({_id: 'team1'});
      let cat = await Factory.createCategory({_id: 'cat'});
      let event = await Factory.createEvent({_id: 'ev1', teamType_ids: [tt._id],
                                             heats: {cat: 'F1'}});
      let competitors = await Factory.createCompetitor({
        _id: 'comp1', team_ids: ['team1'], category_ids: ['cat']});
      let res1 = await Factory.createResult({_id: 'res1', scores: [0.1]});
      let res2 = await Factory.createResult({_id: 'res2', scores: [0.2]});

      assert.equals(await sut.getTeamScores(event), {});
    });

    test('more than 30', async () => {
      let tt = await Factory.createTeamType({_id: 'tt1'});
      let team = await Factory.createTeam({_id: 'team1'});
      let cat = await Factory.createCategory({_id: 'cat'});
      let event = await Factory.createEvent({teamType_ids: [tt._id],
                                             heats: {cat: cat.heatFormat}});
      let competitors = await Factory.createList(31, 'createCompetitor', (index, options) => {
        options.team_ids = ['team1'];
        options.category_ids = ['cat'];
      });

      await Factory.createList(31, 'createResult', (index, options) => {
        options.competitor_id = competitors[index]._id;
        options.scores = [0.1, 100 * index];
        options.category_id = 'cat';
      });

      assert.equals(await sut.getTeamScores(event), {tt1: {team1: 818}});
    });

    test('limit counted climbers per team per category', async () => {
      let tt = await Factory.createTeamType({_id: 'tt1'});
      let team1 = await Factory.createTeam({_id: 'team1'});
      let team2 = await Factory.createTeam({_id: 'team2'});
      let cat1 = await Factory.createCategory({_id: 'cat1'});
      let cat2 = await Factory.createCategory({_id: 'cat2'});
      let event = await Factory.createEvent({
        teamType_ids: [tt._id],
        heats: {cat1: cat1.heatFormat, cat2: cat2.heatFormat}});
      let competitors = await Factory.createList(
        4, 'createCompetitor',
        (index, options) => {options.team_ids = ['team1']});
      let other = await Factory.createCompetitor({team_ids: ['team2']});

      await Factory.createList(4, 'createResult', (index, options) => {
        options.competitor_id = competitors[index]._id;
        options.scores = [0.1, 100 * index];
        options.category_id = 'cat1';
      });

      await Factory.createResult({
        competitor_id: other._id, category_id: 'cat1', scores: [0.1, 1000]});
      await Factory.createResult({
        competitor_id: competitors[0]._id, category_id: 'cat2', scores: [0.1, 1000]});
      await Factory.createResult({
        competitor_id: competitors[1]._id, category_id: 'cat2', scores: [0.1, 1000]});

      event.maxTeamEnties = 3;
      assert.equals(await sut.getTeamScores(event), {tt1: {team1: 380, team2: 100}});
      event.maxTeamEnties = 1;
      assert.equals(await sut.getTeamScores(event), {tt1: {team1: 170, team2: 100}});
    });
  });
});
