define(function(require, exports, module) {
  const Dom        = require('koru/dom');
  const SelectMenu = require('koru/ui/select-menu');
  const util       = require('koru/util');
  const TeamType   = require('models/team-type');

  const $ = Dom.current;

  let teamType_id = undefined;

  util.extend(exports, {
    get teamType_id() {
      if (teamType_id === undefined) {
        const teamType = TeamType.findBy('name', 'Club');
        teamType_id = teamType ? teamType._id : null;
      }
      return teamType_id;
    },

    set teamType_id(value) {
      teamType_id = value;
    },

    chooseTeamTypeEvent(event) {
      Dom.stopEvent();
      let ctx = $.ctx;
      let list = TeamType.query.fetch();
      SelectMenu.popup(this, {
        list,
        onSelect(elm) {
          let id = $.data(elm)._id;
          exports.teamType_id = id;
          ctx.updateAllTags();
          return true;
        }
      });
    },

    teamTD() {
      const team = teamType_id && this.teamMap[teamType_id];
      return team && Dom.h({span: team.shortName, $title: team.name});
    },

    sortBy(a, b) {
      return util.compareByName(a.team(teamType_id), b.team(teamType_id));
    },

    teamTypeField(field) {
      return exports.teamType_id && TeamType.findById(teamType_id)[field];
    }
  });

  Dom.registerHelpers({
    selectedTeamType() {
      return exports.teamTypeField('name');
    },
  });
});
