define(function(require, exports, module) {
  const Dom        = require('koru/dom');
  const SelectMenu = require('koru/ui/select-menu');
  const util       = require('koru/util');
  const Series     = require('models/series');
  const TeamType   = require('models/team-type');

  const Tpl = Dom.newTemplate(module, require('koru/html!./team-helper'));
  const $ = Dom.current;

  let teamType_id = undefined;

  util.extend(exports, {
    get teamType_id() {
      if (teamType_id === undefined) {
        const teamType = TeamType.findBy('default', true);
        teamType_id = teamType ? teamType._id : null;
      }
      return teamType_id;
    },

    set teamType_id(value) {
      teamType_id = value;
    },

    setSeriesTeamType(series, value) {
      series = Series.toDoc(series);
      value = TeamType.toId(value);

      const {teamType_ids} = series;

      if (value && teamType_ids && teamType_ids.indexOf(value) !== -1)
        return teamType_id = value;

      if (teamType_ids.indexOf(teamType_id) !== -1)
        return teamType_id;

      const tt = TeamType.where({_id: teamType_ids}).sort('default', -1).fetchOne();
      if (tt)
        return teamType_id = tt._id;
    },

    chooseTeamTypeEvent(listBuilder) {
      return function () {
        Dom.stopEvent();
        let ctx = $.ctx;

        SelectMenu.popup(this, {
          list: listBuilder(ctx).sort(util.compareByName),
          onSelect(elm) {
            let id = $.data(elm)._id;
            exports.teamType_id = id;
            ctx.updateAllTags();
            return true;
          }
        });
      };
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

  Tpl.AssignTeamTypes.$helpers({
    teamTypes,
  });

  function teamTypes(callback) {
    callback.render({
      model: TeamType,
      sort: util.compareByName,
    });
  }


  Tpl.AssignTeamTypes.TeamType.$helpers({
    checked() {
      let teamType_ids = $.ctx.parentCtx.data.teamType_ids;
      Dom.setClass('checked', teamType_ids && teamType_ids.indexOf(this._id) !== -1);
    },
  });

  Tpl.AssignTeamTypes.TeamType.$events({
    'click .check'() {
      Dom.stopEvent();

      let event = $.ctx.parentCtx.data;
      let checked = Dom.toggleClass(this.parentNode, 'checked');
      let list = event.$change('teamType_ids');
      if (! list){
        event.teamType_ids = list = [];
      }
      if (checked) {
        list.push($.ctx.data._id);
      } else {
        util.removeItem(list, $.ctx.data._id);
      }
    },
  });




  Dom.registerHelpers({
    selectedTeamType() {
      return exports.teamTypeField('name');
    },
  });
});
