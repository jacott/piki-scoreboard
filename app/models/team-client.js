define(function(require, exports, module) {
  const util  = require('koru/util');

  return function(Team) {
    Team.teamMap = function (list) {
      let map = {};
      list && list.forEach(id => {
        let team = Team.findById(id);
        map[team.teamType_id] = team;
      });
      return map;
    };
  };

});
