define(function(require, exports, module) {
  const util     = require('koru/util');
  const Climber  = require('models/climber');
  const Team     = require('models/team');
  const Category = require('./category');

  return function (model) {
    model.eventIndex = model.addUniqueIndex('event_id', 'climber_id');

    util.extend(model.prototype, {
      categoryIdForGroup: function (group) {
        var groupHash = this.$cache.groupHash || (this.$cache.groupHash = makeGroupHash(this.category_ids));
        return groupHash[group];
      },

      get teamMap() {
        let map = this.$cache.teamMap;
        if (! map) {
          map = this.$cache.teamMap = Team.teamMap(this.team_ids);
        }
        return map;
      },

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
      },

      team(teamType_id) {
        return this.teamMap[model.toId(teamType_id)];
      },
    });
  };

  function makeGroupHash(ids) {
    var groupHash = {};
    if (! ids) return groupHash;
    var docs = Category.docs;
    for(var i = 0; i < ids.length; ++i) {
      var id = ids[i];
      var doc = docs[id];
      if (doc)
        groupHash[doc.group] = id;
    }
    return groupHash;
  }
});
