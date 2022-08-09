define((require)=> mig =>{
  'use strict';
  const ClimberRanking  = require('models/climber-ranking');
  const Event           = require('models/event');

  mig.reversible({
    async add(db) {
      for (const ev of await Event.query.fetch()) {
        await ClimberRanking.summarize(ev);
      }
    },

    revert(db) {
      return db.query('truncate "ClimberRanking"');
    }
  });

  mig.addIndex("Competitor", {columns: ['event_id', 'climber_id'], unique: true});
});
