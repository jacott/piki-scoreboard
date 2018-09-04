define((require, exports, module)=>{
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const Heat            = require('models/heat');
  const Series          = require('models/series');

  return Ranking =>{
    session.defineRpc("Ranking.seriesResult", series_id =>{
      Val.ensureString(series_id);

      const series = Series.findById(series_id);
      const ans = [];
      let ce, ce_id, cc, cc_id, fmt;

      const sumCat = ()=>{
        if (! cc) return;

        cc && ce.cats.push({
          category_id: cc_id,
          fmt,
          results: new Heat(-1, fmt).sort(cc).map(row => [row.climber_id, row.sPoints]),
        });
      };

      Series.db.query(`
select climber_id, event_id, category_id, scores, time, e.heats->>category_id as fmt
from "Result", "Event" as e
where e.series_id = $1 and e._id = event_id order by event_id, category_id
`, [series_id])
        .forEach(row => {
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
        });
      if (ce) {
        sumCat();
        ans.push(ce);
      }
      return ans;
    });
    session.defineRpc("Ranking.teamResults", series_id =>{
      Val.ensureString(series_id);
      const series = Series.findById(series_id);
      const ans = [];

      let competitorToTeamsMap;
      let ce, ce_id, results, cc_id, resultsMap;

      const sumResults = ()=>{
        if (! ce) return;
        const scores = Ranking.getTeamScores(ce, {findCompetitorTeamIds, findResults});
        ans.push({event_id: ce_id, scores});
      };

      const findCompetitorTeamIds = id => competitorToTeamsMap[id];

      const findResults = category_id => resultsMap[category_id] || [];


      Series.db.query(`
select r.event_id, category_id, scores, time, e.heats, cp.team_ids, r.competitor_id
from "Result" as r, "Event" as e, "Competitor" as cp
where e.series_id = $1 and e._id = r.event_id and cp._id = competitor_id
order by r.event_id, category_id
`,
                      [series_id])
        .forEach(row => {
          if (ce_id !== row.event_id) {
            sumResults();
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
        });

      sumResults();
      return ans;
    });
  };
});
