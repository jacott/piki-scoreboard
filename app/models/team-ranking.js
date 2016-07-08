define(function(require, TeamRanking, module) {
  const util       = require('koru/util');
  const Competitor = require('models/competitor');
  const Heat       = require('models/heat');
  const Result     = require('models/result');
  const Team       = require('models/team');

  module.exports = TeamRanking = {};

  TeamRanking.getTeamScores = function(event, number) {
    number = number || 30;
    let category_ids = Object.keys(event.heats);
    let scores = {};
    event.teamType_ids.forEach(id => {
      scores[id] = {};
    });

    category_ids.forEach(id => {
      let teamCounts = {};
      let results = Result.where({category_id: id, event_id: event._id}).fetch();
      let heat = new Heat(-1, event.heats[id]);
      heat.sort(results);

      for(var i = 0; i < Math.min(results.length, 30); ++i) {
        let result = results[i];
        var team_ids = Competitor.findById(result.competitor_id).team_ids;
        team_ids.forEach(tid => {
          let team = Team.findById(tid);

          if (! teamCounts[team._id]) {
            if (scores[team.teamType_id][team._id])
              scores[team.teamType_id][team._id] += result.sPoints;
            else
              scores[team.teamType_id][team._id] = result.sPoints;
            teamCounts[team._id] = 1;
          } else if (teamCounts[team._id] < number) {
            scores[team.teamType_id][team._id] += result.sPoints;
            ++teamCounts[team._id];
          }
        });
      }

    });

    return scores;
  };
});
