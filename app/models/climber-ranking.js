define((require, exports, module)=>{
  'use strict';
  const Model           = require('model');
  const Climber         = require('models/climber');
  const Event           = require('models/event');
  const Heat            = require('models/heat');
  const Result          = require('models/result');
  const SpeedRound      = require('models/speed-round');

  class ClimberRanking extends Model.BaseModel {
    static summarize(event) {
      const {heats, _id: event_id} = event;

      const {db} = ClimberRanking;

      db.query(`delete from "ClimberRanking" where event_id = $1`, [event_id]);

      for (const category_id in heats) {
        const format = heats[category_id];
        const query = Result.query.withIndex(Result.eventCatIndex, {event_id, category_id});
        switch (format[0]) {
        case 'S': {
          const round = new SpeedRound({stage: -1, query});

          round.rankResults();

          for (const r of round) {
            const rank = SpeedRound.ranking(r);
            ClimberRanking.docs.insert({
              climber_id: r.climber_id, event_id, category_id,
              rank,
              points: Heat.pointsTable[rank-1] || 0,
              type: 'S',
            });
          }
        } break;
        default: {
          const heat = new Heat(-1, format);
          const results = query.fetch();
          let ppoints = -1;
          let rank = 0;
          heat.sort(results);
          for (const r of results) {
            if (ppoints !== r.sPoints) {
              ppoints = r.sPoints;
              ++rank;
            }
            ClimberRanking.docs.insert({
              climber_id: r.climber_id, event_id, category_id,
              rank,
              points: r.sPoints || 0,
              type: heat.type,
            });
          }
        } break;
        }
      }
    }
  }

  ClimberRanking.define({module, fields: {
    climber_id: {type: "belongs_to"},
    event_id: {type: "belongs_to"},
    category_id: {type: "belongs_to"},
    rank: {type: "number"},
    points: {type: "number"},
    type: {type: 'text'},
  }});


  module.onUnload(Event.onChange(dc => {
    if (dc.isChange && dc.hasField('closed') && dc.doc.closed) {
      ClimberRanking.summarize(dc.doc);
    }
  }));

  return ClimberRanking;
});
