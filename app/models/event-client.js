define(function(require, exports, module) {
  const util     = require('koru/util');
  const TeamType = require('models/team-type');

  return function (Event) {
    util.merge(Event.prototype, {
      get sortedTeamTypes() {
        let list = this.$cache.sortedTeamTypes;
        if (! list) {
          list = this.$cache.sortedTeamTypes = this.teamType_ids.map(id => TeamType.findById(id));
          list.sort(util.compareByName);
        }
        return list;
      },
    });
  };
});
