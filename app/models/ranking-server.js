define((require, exports, module) => {
  const PsSql           = require('koru/model/ps-sql');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const Heat            = require('models/heat');
  const Series          = require('models/series');
  const Team            = require('models/team');

  const eventsBySeriesSql = new PsSql(`
select climber_id, event_id, category_id, scores, time, e.heats->>category_id as fmt
from "Result", "Event" as e
where e.series_id = {$_id} and e._id = event_id order by event_id, category_id
`, Series);

  const teamsBySeriesSql = new PsSql(`
select r.event_id, category_id, scores, time, e.heats, cp.team_ids, r.competitor_id
from "Result" as r, "Event" as e, "Competitor" as cp
where e.series_id = {$_id} and e._id = r.event_id and cp._id = r.competitor_id
order by r.event_id, category_id
`, Series);

  session.defineRpc('Ranking.seriesResult', async (series_id) => {
    Val.ensureString(series_id);

    const ans = [];
    let ce, ce_id, cc, cc_id, fmt;

    const sumCat = () => {
      if (! cc) return;

      cc && ce.cats.push({
        category_id: cc_id,
        fmt,
        results: new Heat(-1, fmt).sort(cc).map((row) => [row.climber_id, row.sPoints]),
      });
    };

    for (const row of await eventsBySeriesSql.fetch({_id: series_id})) {
      if (cc_id !== row.category_id || ce_id !== row.event_id) {
        sumCat();
        cc_id = row.category_id;
        fmt = row.fmt;
        cc = [];
      }
      if (ce_id !== row.event_id) {
        ce && ans.push(ce);
        ce_id = row.event_id;
        ce = {event_id: ce_id, cats: []};
      }

      cc.push(row);
    }
    if (ce) {
      sumCat();
      ans.push(ce);
    }
    return ans;
  });

  session.defineRpc('Ranking.teamResults', async (series_id) => {
    Val.ensureString(series_id);
    const ans = [];

    let competitorToTeamsMap;
    let ce, ce_id, results, cc_id, resultsMap;

    const getTeamScores = async (event) => {
      const number = event.maxTeamEnties || 30;
      let category_ids = Object.keys(event.heats);
      let scores = {};

      for (const id of category_ids) {
        const teamCounts = {};
        const results = resultsMap[id] ?? [];
        const heat = new Heat(-1, event.heats[id]);

        heat.sort(results);

        for (let i = 0; i < Math.min(results.length, 30); ++i) {
          let result = results[i];
          if (result.sPoints === null) continue;
          var team_ids = competitorToTeamsMap[result.competitor_id];
          if (team_ids !== undefined) {
            for (const team_id of team_ids) {
              const {teamType_id} = await Team.findById(team_id);
              const ttScores = scores[teamType_id] || (scores[teamType_id] = {});

              if (! teamCounts[team_id]) {
                if (ttScores[team_id]) {
                  ttScores[team_id] += result.sPoints;
                } else {
                  ttScores[team_id] = result.sPoints;
                }
                teamCounts[team_id] = 1;
              } else if (teamCounts[team_id] < number) {
                ttScores[team_id] += result.sPoints;
                ++teamCounts[team_id];
              }
            }
          }
        }
      }

      return scores;
    };

    const sumResults = async () => {
      if (ce === undefined) return;
      const scores = await getTeamScores(ce);
      ans.push({event_id: ce_id, scores});
    };

    for (const row of await teamsBySeriesSql.fetch({_id: series_id})) {
      if (ce_id !== row.event_id) {
        await sumResults();
        ce_id = row.event_id;
        ce = {_id: ce_id, heats: row.heats};
        resultsMap = {};
        competitorToTeamsMap = {};
        cc_id = null;
      }
      if (cc_id !== row.category_id) {
        cc_id = row.category_id;
        resultsMap[cc_id] = results = [];
      }
      competitorToTeamsMap[row.competitor_id] = row.team_ids;
      results.push(row);
    }

    await sumResults();
    return ans;
  });
});
