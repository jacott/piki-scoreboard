define(function(require, TeamRanking, module) {
  const util       = require('koru/util');
  const Competitor = require('models/competitor');
  const Heat       = require('models/heat');
  const Result     = require('models/result');
  const Team       = require('models/team');

  module.exports = TeamRanking = {};

  TeamRanking.getTeamScores = function(event) {
    let category_ids = Object.keys(event.heats);
    let scores = {};
    event.teamType_ids.forEach(id => {
      scores[id] = {};
    });

    category_ids.forEach(id => {
      let results = Result.where({category_id: id, event_id: event._id}).fetch();
      let heat = new Heat(-1, event.heats[id]);
      heat.sort(results);
      results.forEach(result => {
        var team_ids = Competitor.findById(result.competitor_id).team_ids;
        team_ids.forEach(tid => {
          let team = Team.findById(tid);

          if (scores[team.teamType_id][team._id])
            scores[team.teamType_id][team._id] += result.sPoints;
          else
            scores[team.teamType_id][team._id] = result.sPoints;
        });
      });
    });

    return scores;
  };
});
