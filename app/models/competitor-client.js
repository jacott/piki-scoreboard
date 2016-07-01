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

      setTeam(team) {
        team = Team.toDoc(team);
        let map = teamMap(this.team_ids);
        map[team.teamType_id] = team._id;
        this.team_ids = util.values(map);
      },

      team: Climber.prototype.team,
    });
  };

  function teamMap(list) {
    let map = {};
    list && list.forEach(id => {
      let team = Team.findById(id);
      map[team.teamType_id] = id;
    });
    return map;
  }

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
