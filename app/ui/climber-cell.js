define((require, exports, module) => {
  const Dom             = require('koru/dom');
  const Team            = require('models/team');

  const Tpl = Dom.newTemplate(module, require('koru/html!./climber-cell'));
  const $ = Dom.current;

  Tpl.$helpers({
    teams() {
      const frag = document.createDocumentFragment();
      const teamMap = {};
      for (const tid of this.competitor.team_ids) {
        const team = Team.findById(tid);
        teamMap[team.teamType_id] = team;
      }

      this.event.sortedTeamTypes.forEach((tt) => {
        const team = teamMap[tt._id];
        frag.appendChild(Dom.h({span: team?.shortName ?? ''}));
      });
      return frag;
    },
  });

  return Tpl;
});
