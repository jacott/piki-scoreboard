define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Team            = require('models/team');

  const Tpl = Dom.newTemplate(module, require('koru/html!./climber-cell'));
  const $ = Dom.current;

  Tpl.$helpers({
    teams() {
      let frag = document.createDocumentFragment();
      let teamMap = {};
      for (let tid of this.competitor.team_ids) {
        let team = Team.findById(tid);
        teamMap[team.teamType_id] = team;
      }

      this.event.sortedTeamTypes.forEach(tt => {
        let team = teamMap[tt._id];
        frag.appendChild(Dom.h({span: team ? team.shortName : ""}));
      });
      return frag;
    },
  });

  return Tpl;
});
