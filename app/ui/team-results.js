define(function(require, exports, module) {
  const Dom        = require('koru/dom');
  const Route      = require('koru/ui/route');
  const util       = require('koru/util');
  const Ranking    = require('models/ranking');
  const Team       = require('models/team');
  const TeamType   = require('models/team-type');
  const App        = require('ui/app');
  const EventTpl   = require('ui/event');
  const TeamHelper = require('ui/team-helper');

  const Tpl = Dom.newTemplate(module, require('koru/html!./team-results'));
  const $ = Dom.current;

  EventTpl.base.addTemplate(module, Tpl, {
    focus: true,
    data(page, pageRoute) {
      if (! EventTpl.event) Route.abortPage();
      return EventTpl.event;
    }
  });

  Tpl.$extend({
    titleSuffix: 'Team results',
  });

  Tpl.$helpers({
    teams(callback) {
      const scores = Ranking.getTeamScores(EventTpl.event)[TeamHelper.teamType_id] || {};
      callback.clear();

      Object.keys(scores).map(id => {
        const team = Team.findById(id);
        return {id, team, points: scores[id]};
      }).sort(util.compareByField('points', -1))
        .forEach(row => callback(row));
    },
  });

  Tpl.$events({
    'mousedown [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent(teamTypeList),
  });

  function teamTypeList(ctx) {
    return TeamType.where({_id: ctx.data.teamType_ids}).fetch();
  }

  return Tpl;
});
