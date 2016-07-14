define(function(require, exports, module) {
  const koru        = require('koru');
  const Dom         = require('koru/dom');
  const session     = require('koru/session');
  const Route       = require('koru/ui/route');
  const util        = require('koru/util');
  const Category    = require('models/category');
  const Climber     = require('models/climber');
  const Event       = require('models/event');
  const Series      = require('models/series');
  const Team        = require('models/team');
  const PrintHelper = require('ui/print-helper');
  const TeamHelper  = require('ui/team-helper');

  const Tpl = Dom.newTemplate(module, require('koru/html!./series'));
  const $ = Dom.current;

  const base = Route.root.addBase(module, Tpl, {
    focus: true,
    routeVar: 'seriesId',
  });

  const commonPageOptions = {
    data: seriesFromRouteVar,
    afterRendered: tabOpened,
  };

  function seriesFromRouteVar(page, pageRoute) {
    return Series.findById(pageRoute.seriesId);
  }

  base.addTemplate(module, Tpl.Events, Object.create(commonPageOptions, {
    defaultPage: {value: true},
  }));

  function tabOpened(elm, pageRoute) {
    const button = document.querySelector(`#Series .tab[name="${this.name}"]`);
    const ctx = Dom.ctx(elm);
    ctx.tabButton = button;
    Dom.addClass(button, 'selected');
  }

  function tabClosed(ctx) {
    Dom.removeClass(ctx.tabButton, 'selected');
  }

  const ResultsBodyBase = base.addBase(module, Tpl.Results);
  ResultsBodyBase.async = true;

  ResultsBodyBase.addTemplate(module, Tpl.CatResult, {
    data(page, pageRoute) {
      return pageRoute;
    },
    insertPage(elm) {
      const parent = Tpl.Results.$ctx(elm).element();
      parent.insertBefore(elm, parent.firstChild);
    },
  });

  base.addTemplate(module, Tpl.TeamResults, Object.create(commonPageOptions));

  const sortByDate = util.compareByField('date', -1);

  Tpl.$events({
    'click button.tab'(event) {
      Dom.stopEvent();

      Route.replacePage(Tpl[this.getAttribute('name')]);
    },
  });

  Tpl.$extend({
    onBaseEntry(page, pageRoute) {
      const series = Series.findById(pageRoute.seriesId);
      if (! series) Route.abortPage('events/#series');
      Route.title = page.title = series.name;
      const elm = Tpl.$autoRender();
      const ctx = Dom.myCtx(elm);
      document.body.appendChild(elm);
    },

    onBaseExit() {
      Dom.removeId('Series');
      Route.title = null;
    },
  });

  Tpl.Events.$helpers({
    list(callback) {
      callback.render({
        model: Event,
        sort: sortByDate,
        params: {
          series_id: this._id,
        }});
    },
  });

  Tpl.Events.Row.$events({
    'click'(event) {
      Dom.stopEvent();

      Route.gotoPage(Dom.Event.Show, {eventId: $.ctx.data._id});
    },
  });

  Tpl.Events.$extend({
    $destroyed: tabClosed,
  });

  Tpl.Results.$helpers({
    content() {
      const selected = document.querySelector('#Results>.categories>.cat.selected');
      if (selected)
        return Dom.h([{button: "Print selection", class: 'link printResults'},
                      {button: "Clear selection", class: 'link clearSelected'}]);
      return "Select categories to print";
    },
  });

  Tpl.Results.$events({
    'click .select': PrintHelper.clickSelect(function (me, selected, parent) {
      Dom.forEach(parent, '.heading.selected',
                  elm => Dom.removeClass(elm, 'selected'));

      const action = parent.getElementsByClassName('action')[0];

      $.ctx.updateAllTags();
    }),

    'click .clearSelected'(event) {
      Dom.stopEvent();
      var parent = event.currentTarget;
      var selected = parent.getElementsByClassName('selected');
      while (selected.length)
        Dom.removeClass(selected[0], 'selected');
    },

    'click .printResults'(event) {
      Dom.stopEvent();
      var parent = event.currentTarget;
      var selected = parent.getElementsByClassName('selected');

      var elm = Dom.h({section: '', class: 'print-only'});
      for(var i = 0; i < selected.length; ++i) {
        elm.appendChild(Tpl.CatResult.$render({append: $.data(selected[i])._id}));
      }
      parent.parentNode.appendChild(elm);
      Dom.addClass(parent, 'no-print');

      window.print();

      Dom.remove(elm);
      Dom.removeClass(parent, 'no-print');
    },

  });

  Tpl.Results.$extend({
    onBaseEntry(page, pageRoute, callback) {
      const series = Series.findById(pageRoute.seriesId);
      const elm = Tpl.Results.$autoRender({});
      const parent = document.querySelector('#Series .tabBody');
      parent.insertBefore(elm, parent.firstChild);
      tabOpened.call(Tpl.Results, elm, pageRoute);
      const ctx = Dom.myCtx(elm);
      session.rpc("Ranking.seriesResult", series._id, (err, results) => {
        if (err) {
          koru.globalErrorCatch(err);
          return;
        }
        Dom.removeClass(elm, 'loading');
        ctx.results = results;
        elm.insertBefore(renderCategories(ctx), elm.firstChild);
        callback();
      });

    },

    onBaseExit() {Dom.removeId('Results')},

    $destroyed: tabClosed,
  });

  Tpl.CatList.$events({
    'click .name'(event) {
      Dom.stopEvent();
      const series = Series.findById(Route.currentPageRoute.seriesId);
      const cat = $.ctx.data;

      Route.gotoPage(Tpl.CatResult, {seriesId: series._id, append: cat._id});
    },
  });

  Tpl.CatResult.$helpers({
    category() {
      return Category.findById(this.category_id);
    },
    events(callback) {
      for (let row of this.events)
        callback(row);
    },
    climbers(callback) {
      for (let row of this.climbers)
        callback(row);
    },
  });

  Tpl.CatResult.$extend({
    $created(ctx, elm) {
      const resultsBody = document.getElementById('Results');
      const resultsCtx = Dom.ctx(resultsBody);
      ctx.parentCtx = resultsCtx;

      const {results} = resultsCtx;

      const climberMap = {};

      const category_id = ctx.data.append;
      const climbers = [];
      const events = [];

      ctx.data = {climbers, events, category_id};

      if (results) for (let ev of results) {
        events.push(Event.findById(ev.event_id));
        for (let cat of ev.cats) {
          if (cat.category_id === category_id) {
            for (let [climber_id, points] of cat.results) {
              let climber = climberMap[climber_id];
              if (! climber)
                climbers.push(climber = climberMap[climber_id] = {
                  _id: climber_id,
                  climber: Climber.findById(climber_id),
                  total: 0,
                  events: {},
                });
              climber.total += points;
              climber.events[ev.event_id] = points;
            }
          }
        }
      }

      events.sort(sortByDate);
      climbers.sort(util.compareByField('total', -1));
    },
  });

  Tpl.CatResult.Row.$helpers({
    events(callback) {
      const eventMap = this.events;

      for (let row of $.ctx.parentCtx.data.events)
        callback({_id: row._id, points: eventMap[row._id]});
    },
  });

  function renderCategories(ctx) {
    const {results} = ctx;
    const compareCats = util.compareByFields('type', 'name');
    const table = Dom.h({table: '', class: 'categories'});
    if (results) {
      const catMap = {};
      for (let {event_id, cats} of results) {
        for (let {category_id} of cats) {
          catMap[category_id] || (catMap[category_id] = Category.findById(category_id));
        }
      }
      let type;
      for (let cat of util.values(catMap).sort(compareCats)) {
        if (type !== cat.type) {
          type = cat.type;
          table.appendChild(Dom.h({tr: {td: '', $colspan: '2'}, class: 'heading fmt '+type}));
        }
        table.appendChild(Tpl.CatList.$autoRender(cat, ctx));
      }
    }

    return table;
  }


  Tpl.TeamResults.$helpers({
    events(callback) {
      callback.clear();
      if (this.events) for (let row of this.events) {
        callback(row);
      }
    },

    teams(callback) {
      callback.clear();
      if (this.teams) for (let row of this.teams) {
        if (row.team.teamType_id === TeamHelper.teamType_id)
          callback(row);
      }
    },
  });

  Tpl.TeamResults.$events({
    'click [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent,
  });


  Tpl.TeamResults.$extend({
    $created(ctx, elm) {
      const series = ctx.data;
      ctx.data = {};

      const parent = document.querySelector('#Series .tabBody');
      parent.insertBefore(elm, parent.firstChild);
      session.rpc("Ranking.teamResults", series._id, (err, results) => {
        if (err) {
          koru.globalErrorCatch(err);
          return;
        }
        Dom.removeClass(elm, 'loading');

        const teams = [];
        const teamMap = {};
        const events = results.map(row => {
          for (let ttid in row.scores) {
            const tScores = row.scores[ttid];
            for (let team_id in tScores) {
              let team = teamMap[team_id];
              if (! team) {
                teams.push(team = teamMap[team_id] = {
                  _id: team_id,
                  team: Team.findById(team_id),
                  total: 0,
                  events: {},
                });
              }
              const points = tScores[team_id];
              team.total += points;
              team.events[row.event_id] = points;
            }
          }
          return Event.findById(row.event_id);
        });

        teams.sort(util.compareByField('total', -1));
        events.sort(util.compareByField('date', -1));

        ctx.updateAllTags({events, teams});
      });
    },

    $destroyed: tabClosed,
  });

  Tpl.TeamResults.Row.$helpers({
    events(callback) {
      const eventMap = this.events;
      const {events} = $.ctx.parentCtx.data;
      for (let event of events) {
        callback({_id: event._id, event, points: eventMap[event._id]});
      }
    },
  });

  return Tpl;
});
