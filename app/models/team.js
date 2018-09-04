define((require, exports, module)=>{
  const Model           = require('model');
  const Org             = require('models/org');
  const TeamType        = require('./team-type');

  class Team extends Model.BaseModel {
    static teamMap(list) {
      let map = {};
      list && list.forEach(id => {
        let team = Team.findById(id);
        if (team) map[team.teamType_id] = team;
      });
      return map;
    }
  }

  class HasTeam extends Model.BaseModel {
    get teamMap() {

      let map = this.$cache.teamMap;
      if (! map) {
        map = this.$cache.teamMap = Team.teamMap(this.team_ids);
      }
      return map;
    }

    getTeam(id) {
      return this.teamMap[Model.BaseModel.toId(id)];
    }
  }

  Team.HasTeam = HasTeam;

  Team.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
      shortName: {type:  'text', trim: true, required: true, maxLength: 5, unique: {scope: ['org_id', 'teamType_id']}},
      teamType_id: {type: 'belongs_to', required: true},
      org_id: 'belongs_to',
    },
  });

  require('koru/env!./team')(Team);

  return Team;
});
