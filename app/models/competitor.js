//;no-client-async
define((require, exports, module) => {
  const Val             = require('koru/model/validation');
  const Category        = require('./category');
  const Climber         = require('./climber');
  const Event           = require('./event');
  const Team            = require('models/team');

  class Competitor extends Team.HasTeam {
    async setTeam(teamType_id, team_id) {
      const map = await this.teamMap;
      const team = await Team.findById(team_id);
      map[teamType_id] = team;
      const list = [];
      for (const ttid in map) {
        const team = map[ttid];
        team !== undefined && list.push(team._id);
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
        return Competitor.getField(this, 'team_ids') ?? [];
      }}},
      category_ids: 'has_many',
      number: {type: 'integer', number: {integer: true, $gt: 0}},
      createdAt: 'auto_timestamp',
    },
  });

  Competitor.registerObserveField('event_id');
  module.onUnload(Competitor.afterLocalChange(async (dc) => {
    if (dc.isDelete) return;

    const team_idsChanged = (dc.hasField('team_ids'));
    const numberChanged = (dc.hasField('number'));

    if (team_idsChanged || numberChanged) {
      const {doc} = dc;
      doc.$cache.teamMap = undefined;
      const updates = {};

      const climber = await Climber.findById(doc.climber_id);
      if (team_idsChanged) {
        const clTeamMap = await climber.teamMap;
        const coTeamMap = await doc.teamMap;

        for (const tt_id in coTeamMap) {
          clTeamMap[tt_id] = coTeamMap[tt_id];
        }

        const list = [];
        for (const ttid in clTeamMap) {
          const team = clTeamMap[ttid];
          team !== undefined && list.push(team._id);
        }
        updates.team_ids = list;
      }

      if (numberChanged) {
        updates.number = doc.number;
      }

      await climber.$update(updates);
    }
  }));

  require('koru/env!./competitor')(Competitor);

  return Competitor;
});
