define(function(require, exports, module) {
  const {BaseModel} = require('model');
  const Org         = require('models/org');
  const TeamType    = require('./team-type');

  class Team extends BaseModel {
    static teamMap(list) {
      let map = {};
      list && list.forEach(id => {
        let team = Team.findById(id);
        if (team) map[team.teamType_id] = team;
      });
      return map;
    }
  }

  class HasTeam extends BaseModel {
    get teamMap() {

      let map = this.$cache.teamMap;
      if (! map) {
        map = this.$cache.teamMap = Team.teamMap(this.team_ids);
      }
      return map;
    }

    getTeam(id) {
      return this.teamMap[BaseModel.toId(id)];
    }

    get team() {return this.teamMap[Team.teamType_id]}

    get teamName() {
      const {team} = this;
      return team == null ? null : team.name;
    }
  }

  Team.HasTeam = HasTeam;

  Team.teamType_id = undefined;

  module.exports = Team.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
      shortName: {type:  'text', trim: true, required: true, maxLength: 5, unique: {scope: ['org_id', 'teamType_id']}},
      teamType_id: {type: 'belongs_to', required: true},
      org_id: 'belongs_to',
    },
  });

  require('koru/env!./team')(Team);
});
