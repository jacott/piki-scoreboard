define((require)=>{
  const Competitor      = require('models/competitor');
  const Heat            = require('models/heat');
  const Result          = require('models/result');
  const Team            = require('models/team');

  const findCompetitorTeamIds = id => Competitor.findById(id).team_ids;

  const findResults = (category_id, event_id)=> Result.where({category_id, event_id}).fetch();

  const Ranking = {
    getTeamScores(event, options={findCompetitorTeamIds, findResults}) {
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
        if (result.sPoints === null) continue;
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
    },
  };

  require('koru/env!./ranking')(Ranking);

  return Ranking;
});
