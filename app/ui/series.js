define(function(require, exports, module) {
  const koru        = require('koru');
  const Dom         = require('koru/dom');
  const session     = require('koru/session');
  const Dialog      = require('koru/ui/dialog');
  const Form        = require('koru/ui/form');
  const Route       = require('koru/ui/route');
  const util        = require('koru/util');
  const Category    = require('models/category');
  const Climber     = require('models/climber');
  const Event       = require('models/event');
  const Series      = require('models/series');
  const Team        = require('models/team');
  const TeamType    = require('models/team-type');
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

  base.addTemplate(module, Tpl.Events, Object.create(commonPageOptions));
  base.addTemplate(module, Tpl.Edit, Object.create(commonPageOptions));

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

  base.addTemplate(module, Tpl.TeamResults, Object.create(commonPageOptions, {
    defaultPage: {value: true}
  }));

  const sortByDate = util.compareByField('date', -1);

  Tpl.$events({
    'click button.tab'(event) {
      Dom.stopEvent();

      Route.gotoPage(Tpl[this.getAttribute('name')]);
    },
  });

  Tpl.$extend({
    onBaseEntry(page, pageRoute) {
      const series = Series.findById(pageRoute.seriesId);
      if (! series) Route.abortPage('/'+pageRoute.orgSN+'/events/#series');
      Route.title = series.name;
      const elm = Tpl.$autoRender();
      const ctx = Dom.myCtx(elm);
      document.body.appendChild(elm);
      base.childAnchor = elm.querySelector('#SeriesBody');
      ctx.onDestroy(Series.observeId(series._id, dc => Dom.setTitle(dc.doc.name)));
    },

    onBaseExit() {
      Dom.removeId('Series');
      Route.title = null;
    },
  });

  Tpl.Events.$helpers({
    list(each) {
      return {
        query: Event.where({series_id: this._id}),
        compare: sortByDate,
      };
    },
  });

  Tpl.Events.$events({
    'click [name=addEvent]'() {
      Dom.stopEvent();

      const series = $.ctx.data;
      let event = Event.build({org_id: series.org_id, series_id: series._id, teamType_ids: series.teamType_ids});

      Dialog.open(Tpl.AddEvent.$autoRender(event));
    },
  });

  Tpl.AddEvent.$events({
    'click [name=cancel]'() {
      Dom.stopEvent();
      Dialog.close();
    },
    'click [type=submit]': Form.submitFunc('AddEvent', () => Dialog.close()),
  });

  Tpl.Events.$extend({
    $destroyed: tabClosed,
  });

  Tpl.Events.Row.$events({
    'click'(event) {
      Dom.stopEvent();

      Route.gotoPage(Dom.tpl.Event.Show, {eventId: $.ctx.data._id});
    },
  });

  Tpl.Edit.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('Edit', doc => {
      Route.replacePage(Tpl);
    }),
  });

  Tpl.Edit.$extend({
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
      const parent = document.getElementById('SeriesBody');
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
    events(each) {
      return this.events;
    },
    climbers(each) {
      return this.climbers;
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
    events(each) {
      const eventMap = this.events;

      each.clear();
      for (let row of $.ctx.parentCtx.data.events)
        each.append({_id: row._id, points: eventMap[row._id]});
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
    events(each) {
      return this.events || [];
    },

    teams(each) {
      each.clear();
      if (this.teams) for (let row of this.teams) {
        if (row.team.teamType_id === TeamHelper.teamType_id)
          each.append(row);
      }
    },

    teamTypeList: ()=> ctx => TeamType.where({_id: ctx.data.series.teamType_ids}),
  });

  Tpl.TeamResults.$extend({
    $created(ctx, elm) {
      const series = ctx.data;
      ctx.data = {};
      TeamHelper.setSeriesTeamType(series);

      const parent = document.getElementById('SeriesBody');
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

        ctx.updateAllTags({events, teams, series});
      });
    },

    $destroyed: tabClosed,
  });

  Tpl.TeamResults.Header.$events({
    'click th.event'(event) {
      Dom.stopEvent();
      Route.gotoPage(Dom.tpl.Event.Show, {eventId: $.ctx.data._id});
    },
  });

  Tpl.TeamResults.Row.$helpers({
    events(each) {
      const eventMap = this.events;
      const {events} = $.ctx.parentCtx.data;
      each.clear();
      for (let event of events) {
        each.append({_id: event._id, event, points: eventMap[event._id]});
      }
    },
  });

  Tpl.Form.$helpers({
    teamTypes: TeamHelper.eachTeamTypes,
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.history.back();
  }



  return Tpl;
});
