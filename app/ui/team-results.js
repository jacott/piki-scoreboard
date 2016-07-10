define(function(require, exports, module) {
  const Dom         = require('koru/dom');
  const Route       = require('koru/ui/route');
  const util        = require('koru/util');
  const Team        = require('models/team');
  const TeamRanking = require('models/team-ranking');
  const TeamType    = require('models/team-type');
  const App         = require('ui/app');
  const EventTpl    = require('ui/event');
  const TeamHelper  = require('ui/team-helper');

  const Tpl = Dom.newTemplate(module, require('koru/html!./team-results'));
  const $ = Dom.current;

  EventTpl.base.addTemplate(module, Tpl, {
    focus: true,
    data(page, pageRoute) {
      if (! EventTpl.event) Route.abortPage();

      page.title = EventTpl.event.displayName;
      return EventTpl.event;
    }
  });

  Tpl.$helpers({
    teams(callback) {
      const scores = TeamRanking.getTeamScores(EventTpl.event)[TeamHelper.teamType_id] || {};
      callback.clear();

      Object.keys(scores).map(id => {
        const team = Team.findById(id);
        return {id, team, points: scores[id]};
      }).sort(util.compareByField('points', -1))
        .forEach(row => callback(row));
    },
  });

  Tpl.$events({
    'click [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent,
  });

  return Tpl;
});
