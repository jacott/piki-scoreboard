define(function(require, exports, module) {
  const koru        = require('koru');
  const {BaseModel} = require('koru/model');
  const Val         = require('koru/model/validation');
  const util        = require('koru/util');
  const Team        = require('models/team');
  const Category    = require('./category');
  const Climber     = require('./climber');
  const Event       = require('./event');

  class Competitor extends BaseModel {
    get teamMap() {
      let map = this.$cache.teamMap;
      if (! map) {
        map = this.$cache.teamMap = Team.teamMap(this.team_ids);
      }
      return map;
    }

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

    team(teamType_id) {
      return this.teamMap[Competitor.toId(teamType_id)];
    }
  }

  module.exports = Competitor.define({
    module,
    fields: {
      event_id: 'belongs_to',
      climber_id: 'belongs_to',
      team_ids: {type: 'has_many', accessor: {get: function () {
        return Competitor.getField(this, 'team_ids') || [];
      }}},
      category_ids: 'has_many',
      number: {type: 'integer', number: {integer: true, $gt: 0}},
      createdAt: 'auto_timestamp',
    },
  });

  Competitor.registerObserveField('event_id');
  Competitor.afterLocalChange(Competitor, function (doc, changes) {
    if (! doc) return;

    const team_idsChanged = (! changes || doc.$hasChanged('team_ids', changes));
    const numberChanged = (! changes || changes.hasOwnProperty('number'));

    if (team_idsChanged || numberChanged) {
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
  });

  require('koru/env!./competitor')(Competitor);
});
