define(function (require, _, module) {
  var test, v;
  const Category   = require('models/category');
  const Competitor = require('models/competitor');
  const Event      = require('models/event');
  const Result     = require('models/result');
  const Team       = require('models/team');
  const TeamType   = require('models/team-type');
  const TH         = require('test-helper');
  const sut        = require('./team-ranking');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB(v);
      v = null;
    },


    "test Team score simple"() {
      let tt1 = TH.Factory.createTeamType({_id: 'tt1'});
      let team1 = TH.Factory.createTeam({_id: 'team1'});
      let team2 = TH.Factory.createTeam({_id: 'team2'});
      let tt2 = TH.Factory.createTeamType({_id: 'tt2'});
      let team3 = TH.Factory.createTeam({_id: 'team3'});
      let cat1 = TH.Factory.createCategory({_id: 'cat1'});
      let cat2 = TH.Factory.createCategory({_id: 'cat2'});


      let event = TH.Factory.createEvent({teamType_ids: [tt1._id, tt2._id],
                                          heats: {cat1: cat1.heatFormat, cat2: cat2.heatFormat}});
      let compet1 = TH.Factory.createCompetitor({team_ids: [team1._id, team3._id], category_ids: [cat1._id, cat2._id]});
      let compet2 = TH.Factory.createCompetitor({team_ids: [team2._id], category_ids: [cat1._id]});
      let compet3 = TH.Factory.createCompetitor({team_ids: [team1._id, team3._id]});


      TH.Factory.createResult({competitor_id: compet1._id, category_id: cat1._id, scores: [0.1]});
      TH.Factory.createResult({competitor_id: compet1._id, category_id: cat2._id, scores: [0.1]});
      TH.Factory.createResult({competitor_id: compet2._id, category_id: cat2._id, scores: [0.5]});
      TH.Factory.createResult({competitor_id: compet3._id, category_id: cat1._id, scores: [0.5]});

      assert.equals(sut.getTeamScores(event), {tt1: {team1: 260, team2: 100}, tt2: {team3: 260}});

    },

  });
});
