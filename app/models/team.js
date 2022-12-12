//;no-client-async
define((require, exports, module) => {
  'use strict';
  const TeamType        = require('./team-type');
  const Model           = require('model');
  const Org             = require('models/org');

  class Team extends Model.BaseModel {
    static async teamMap(list) {
      const map = {};
      if (list !== undefined) {
        for (const id of list) {
          const team = await Team.findById(id);
          if (team) map[team.teamType_id] = team;
        }
      }
      return map;
    }
  }

  class HasTeam extends Model.BaseModel {
    get teamMap() {
      const map = this.$cache.teamMap;
      if (map !== undefined) return map;
      return ifPromise(Team.teamMap(this.team_ids), (map) => this.$cache.teamMap = map);
    }

    getTeam(id) {
      return this.teamMap[Model.BaseModel.toId(id)];
    }
  }

  Team.HasTeam = HasTeam;

  Team.define({
    module,
    fields: {
      name: {type: 'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
      shortName: {type: 'text', trim: true, required: true, maxLength: 5, unique: {scope: ['org_id', 'teamType_id']}},
      teamType_id: {type: 'belongs_to', required: true},
      org_id: 'belongs_to',
    },
  });

  require('koru/env!./team')(Team);

  return Team;
});
