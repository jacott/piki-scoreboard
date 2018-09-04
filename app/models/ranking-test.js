define((require, exports, module)=>{
  const Category   = require('models/category');
  const Competitor = require('models/competitor');
  const Event      = require('models/event');
  const Result     = require('models/result');
  const Team       = require('models/team');
  const TeamType   = require('models/team-type');
  const TH         = require('test-helper');
  const sut        = require('./ranking');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("Team score simple", ()=>{
      let tt1 = TH.Factory.createTeamType({_id: 'tt1'});
      let team1 = TH.Factory.createTeam({_id: 'team1'});
      let team2 = TH.Factory.createTeam({_id: 'team2'});
      let tt2 = TH.Factory.createTeamType({_id: 'tt2'});
      let team3 = TH.Factory.createTeam({_id: 'team3'});
      let cat1 = TH.Factory.createCategory({_id: 'cat1'});
      let cat2 = TH.Factory.createCategory({_id: 'cat2'});

      let event = TH.Factory.createEvent({
        teamType_ids: [tt1._id, tt2._id],
        heats: {cat1: cat1.heatFormat, cat2: cat2.heatFormat},
      });
      let compet1 = TH.Factory.createCompetitor({
        team_ids: [team1._id, team3._id], category_ids: [cat1._id, cat2._id]});
      let compet2 = TH.Factory.createCompetitor({
        team_ids: [team2._id], category_ids: [cat1._id]});
      let compet3 = TH.Factory.createCompetitor({
        team_ids: [team1._id, team3._id]});
      let compet4 = TH.Factory.createCompetitor({
        team_ids: null});

      TH.Factory.createResult({competitor_id: compet1._id, category_id: cat1._id,
                               scores: [0.1, 100]});
      TH.Factory.createResult({competitor_id: compet1._id, category_id: cat2._id,
                               scores: [0.2, 100]});
      TH.Factory.createResult({competitor_id: compet2._id, category_id: cat2._id,
                               scores: [0.5, 500]});
      TH.Factory.createResult({competitor_id: compet3._id, category_id: cat1._id,
                               scores: [0.7, 500]});
      TH.Factory.createResult({competitor_id: compet4._id, category_id: cat1._id,
                               scores: [0.3, 700]});

      assert.equals(sut.getTeamScores(event), {tt1: {team1: 225, team2: 100}, tt2: {team3: 225}});
    });

    test("not started", ()=>{
      let tt = TH.Factory.createTeamType({_id: 'tt1'});
      let team = TH.Factory.createTeam({_id: 'team1'});
      let cat = TH.Factory.createCategory({_id: 'cat'});
      let event = TH.Factory.createEvent({_id: 'ev1', teamType_ids: [tt._id],
                                          heats: {cat: 'F1'}});
      let competitors = TH.Factory.createCompetitor({
        _id: 'comp1', team_ids: ['team1'], category_ids: ['cat']});
      let res1 = TH.Factory.createResult({_id: 'res1', scores: [0.1]});
      let res2 = TH.Factory.createResult({_id: 'res2', scores: [0.2]});

      assert.equals(sut.getTeamScores(event), {});
    });

    test("more than 30", ()=>{
      let tt = TH.Factory.createTeamType({_id: 'tt1'});
      let team = TH.Factory.createTeam({_id: 'team1'});
      let cat = TH.Factory.createCategory({_id: 'cat'});
      let event = TH.Factory.createEvent({teamType_ids: [tt._id],
                                          heats: {cat: cat.heatFormat}});
      let competitors = TH.Factory.createList(31, 'createCompetitor', (index, options)=>{
        options.team_ids = ['team1'];
        options.category_ids = ['cat'];
      });

      TH.Factory.createList(31, 'createResult', (index, options)=>{
        options.competitor_id = competitors[index]._id;
        options.scores = [0.1, 100*index];
        options.category_id = 'cat';

      });

      assert.equals(sut.getTeamScores(event), {tt1: {team1: 818}});
    });

    test("limit counted climbers per team per category", ()=>{
      let tt = TH.Factory.createTeamType({_id: 'tt1'});
      let team1 = TH.Factory.createTeam({_id: 'team1'});
      let team2 = TH.Factory.createTeam({_id: 'team2'});
      let cat1 = TH.Factory.createCategory({_id: 'cat1'});
      let cat2 = TH.Factory.createCategory({_id: 'cat2'});
      let event = TH.Factory.createEvent({
        teamType_ids: [tt._id],
        heats: {cat1: cat1.heatFormat, cat2: cat2.heatFormat}});
      let competitors = TH.Factory.createList(
        4, 'createCompetitor',
        (index, options)=>{options.team_ids = ['team1']});
      let other = TH.Factory.createCompetitor({team_ids: ['team2']});

      TH.Factory.createList(4, 'createResult', (index, options)=>{
        options.competitor_id = competitors[index]._id;
        options.scores = [0.1, 100*index];
        options.category_id = 'cat1';
      });

      TH.Factory.createResult({
        competitor_id: other._id, category_id: 'cat1', scores: [0.1, 1000]});
      TH.Factory.createResult({
        competitor_id: competitors[0]._id, category_id: 'cat2', scores: [0.1, 1000]});
      TH.Factory.createResult({
        competitor_id: competitors[1]._id, category_id: 'cat2', scores: [0.1, 1000]});

      event.maxTeamEnties = 3;
      assert.equals(sut.getTeamScores(event), {tt1: {team1: 380, team2: 100}});
      event.maxTeamEnties = 1;
      assert.equals(sut.getTeamScores(event), {tt1: {team1: 170, team2: 100}});
    });
  });
});
