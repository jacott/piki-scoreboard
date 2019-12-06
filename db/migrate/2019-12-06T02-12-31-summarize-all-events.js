define((require)=> mig =>{
  'use strict';
  const ClimberRanking  = require('models/climber-ranking');
  const Event           = require('models/event');

  mig.reversible({
    add(db) {
      for (const ev of Event.query.fetch()) {
        ClimberRanking.summarize(ev);
      }
    },

    revert(db) {
      db.query('truncate "ClimberRanking"');
    }
  });
});
