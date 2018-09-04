define((require)=>{
  const util            = require('koru/util');
  const TeamHelper      = require('ui/team-helper');

  return Team =>{
    util.merge(Team.HasTeam.prototype, {
      get team() {return this.teamMap[TeamHelper.teamType_id]},

      get teamName() {
        const {team} = this;
        return team == null ? null : team.name;
      },
    });
  };
});
