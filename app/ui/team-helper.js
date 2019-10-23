define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const SelectMenu      = require('koru/ui/select-menu');
  const util            = require('koru/util');
  const Series          = require('models/series');
  const TeamType        = require('models/team-type');
  const App             = require('ui/app-base');

  const Tpl = Dom.newTemplate(module, require('koru/html!./team-helper'));
  const $ = Dom.current;

  const sortBy = util.compareByField('teamName');

  let teamType_id = undefined, orgId = undefined;

  const Helper = {
    get teamType_id() {
      if (teamType_id === undefined || App.orgId !== orgId) {
        const teamType = TeamType.findBy('default', true);
        Helper.teamType_id = (teamType && teamType._id || null);
      }
      return teamType_id;
    },

    set teamType_id(value) {
      orgId = App.orgId;
      teamType_id = value;
    },

    setSeriesTeamType(series, value) {
      series = Series.toDoc(series);
      value = TeamType.toId(value);

      const {teamType_ids} = series;

      if (value && teamType_ids && teamType_ids.indexOf(value) !== -1)
        return Helper.teamType_id = value;

      if (teamType_ids.indexOf(teamType_id) !== -1)
        return teamType_id;

      const tt = TeamType.where({_id: teamType_ids}).sort('default', -1).fetchOne();
      if (tt)
        return Helper.teamType_id = tt._id;
    },

    teamTD() {
      const team = Helper.teamType_id && this.teamMap[teamType_id];
      return team && Dom.h({span: team.shortName, $title: team.name});
    },

    sortBy,

    teamTypeField(field) {
      let tt = teamType_id && TeamType.findById(teamType_id);
      if (! tt) {
        tt = TeamType.findBy('default', true);
        if (! tt) return;
        Helper.teamType_id = tt._id;
      }
      return tt[field];
    }
  };

  Tpl.AssignTeamTypes.$helpers({
    teamTypes: each =>({
      query: TeamType.query,
      compare: util.compareByName,
    }),
  });

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

  const selectTeamType = Dom.h({button: [], class: "icon", name: "selectTeamType", type: "button"});

  Dom.registerHelpers({
    selectedTeamType(teamTypeList) {
      if ($.isElement())
        $.element.textContent = Helper.teamTypeField('name');
      else {
        const span = Dom.h({span: Helper.teamTypeField('name')});
        const elm = $.element;
        const button = selectTeamType.cloneNode(false);
        elm.parentNode.insertBefore(button, elm.nextSibling);
        const {ctx} = $;
        ctx.addEventListener(button, 'menustart', (event)=>{
          Dom.stopEvent(event);

          SelectMenu.popup(span, {
            list: teamTypeList(ctx).fetch().sort(util.compareByName),
            onSelect(elm) {
              let id = $.data(elm)._id;
              Helper.teamType_id = id;
              ctx.updateAllTags();
              return true;
            }
          });
        });

        return span;
      }
    },
  });

  return Helper;
});
