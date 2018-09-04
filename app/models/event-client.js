define((require)=>{
  const util            = require('koru/util');
  const TeamType        = require('models/team-type');

  return Event =>{
    util.merge(Event.prototype, {
      get sortedTeamTypes() {
        const list = this.$cache.sortedTeamTypes;
        return list || (
          this.$cache.sortedTeamTypes = this.teamType_ids.map(id => TeamType.findById(id))
            .sort(util.compareByName));
      },
    });
  };
});
