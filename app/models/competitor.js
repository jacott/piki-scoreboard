define((require, exports, module)=>{
  const Val             = require('koru/model/validation');
  const Team            = require('models/team');
  const Category        = require('./category');
  const Climber         = require('./climber');
  const Event           = require('./event');

  class Competitor extends Team.HasTeam {
    setTeam(teamType_id, team_id) {
      const map = this.teamMap;
      let team = Team.findById(team_id);
      map[teamType_id] = team;
      let list = [];
      for (let ttid in map) {
        let team = map[ttid];
        team && list.push(team._id);
      }
      this.team_ids = list;
    }

    get name() {return this.climber && this.climber.name}
    get dateOfBirth() {return this.climber.dateOfBirth}
    get gender() {return this.climber.gender}
    get number() {return this.climber.number}
  }

  Competitor.define({
    module,
    fields: {
      event_id: 'belongs_to',
      climber_id: 'belongs_to',
      team_ids: {type: 'has_many', accessor: {get() {
        return Competitor.getField(this, 'team_ids') || [];
      }}},
      category_ids: 'has_many',
      number: {type: 'integer', number: {integer: true, $gt: 0}},
      createdAt: 'auto_timestamp',
    },
  });

  Competitor.registerObserveField('event_id');
  module.onUnload(Competitor.afterLocalChange(dc =>{
    if (dc.isDelete) return;

    const team_idsChanged = (dc.hasField('team_ids'));
    const numberChanged = (dc.hasField('number'));

    if (team_idsChanged || numberChanged) {
      const {doc} = dc;
      doc.$cache.teamMap = null;
      let climber = Climber.findById(doc.climber_id);
      let updates = {};

      if (team_idsChanged) {
        let clTeamMap = climber.teamMap;
        let coTeamMap = doc.teamMap;

        for (let tt_id in coTeamMap) {
          clTeamMap[tt_id] = coTeamMap[tt_id];
        }

        let list = [];
        for (let ttid in clTeamMap) {
          let team = clTeamMap[ttid];
          team && list.push(team._id);
        }
        updates.team_ids = list;
      }

      if (numberChanged) {
        updates.number = doc.number;
      }

      climber.$update(updates);
    }
  }));

  require('koru/env!./competitor')(Competitor);

  return Competitor;
});
