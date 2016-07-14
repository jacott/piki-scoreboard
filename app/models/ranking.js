define(function(require, Ranking, module) {
  const util       = require('koru/util');
  const Competitor = require('models/competitor');
  const Heat       = require('models/heat');
  const Result     = require('models/result');
  const Team       = require('models/team');

  function findCompetitorTeamIds(id) {
    return Competitor.findById(id).team_ids;
  }

  function findResults(category_id, event_id) {
    return Result.where({category_id, event_id}).fetch();
  }

  Ranking.getTeamScores = function(event, options={findCompetitorTeamIds, findResults}) {
    const number = event.maxTeamEnties || 30;
    let category_ids = Object.keys(event.heats);
    let scores = {};

    category_ids.forEach(id => {
      const teamCounts = {};
      const results = options.findResults(id, event._id);
      const heat = new Heat(-1, event.heats[id]);

      heat.sort(results);

      for(let i = 0; i < Math.min(results.length, 30); ++i) {
        let result = results[i];
        var team_ids = options.findCompetitorTeamIds(result.competitor_id);
        team_ids && team_ids.forEach(team_id => {
          const {teamType_id} = Team.findById(team_id);
          const ttScores = scores[teamType_id] || (scores[teamType_id] = {});

          if (! teamCounts[team_id]) {
            if (ttScores[team_id])
              ttScores[team_id] += result.sPoints;
            else
              ttScores[team_id] = result.sPoints;
            teamCounts[team_id] = 1;
          } else if (teamCounts[team_id] < number) {
            ttScores[team_id] += result.sPoints;
            ++teamCounts[team_id];
          }
        });
      }

    });

    return scores;
  };

  require('koru/env!./ranking')(Ranking);
});
