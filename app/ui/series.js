define(function(require, exports, module) {
  const koru     = require('koru');
  const Dom      = require('koru/dom');
  const session  = require('koru/session');
  const Route    = require('koru/ui/route');
  const util     = require('koru/util');
  const Category = require('models/category');
  const Climber  = require('models/climber');
  const Event    = require('models/event');
  const Series   = require('models/series');

  const Tpl = Dom.newTemplate(module, require('koru/html!./series'));
  const $ = Dom.current;

  const Tabs = {
    events: Tpl.Events,
    results: Tpl.Results,
  };

  const base = Route.root.addBase(module, Tpl, {
    focus: true,
    routeVar: 'seriesId',
  });

  base.addTemplate(module, Tpl.Events, {
    defaultPage: true,
    data(page, pageRoute) {
      return Series.findById(pageRoute.seriesId);
    },
    afterRendered: tabOpened,
  });

  function tabOpened(elm, pageRoute) {
    const tab = this.name.toLowerCase();

    const button = document.querySelector(`#Series .tab[name=${tab}]`);
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
      pageRoute.hash = '#results';
      return pageRoute;
    },
    insertPage(elm) {
      const parent = Tpl.Results.$ctx(elm).element();
      parent.insertBefore(elm, parent.firstChild);
    },
  });

  Tpl.$events({
    'click button.tab'(event) {
      Dom.stopEvent();

      Route.replacePage(Tabs[this.getAttribute('name')]);
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

  Tpl.Results.$extend({
    onBaseEntry(page, pageRoute, callback) {
      const series = Series.findById(pageRoute.seriesId);
      const elm = Tpl.Results.$autoRender();
      const parent = document.querySelector('#Series .tabBody');
      parent.insertBefore(elm, parent.firstChild);
      tabOpened.call(Tpl.Results, elm, pageRoute);
      const ctx = Dom.myCtx(elm);
      session.rpc("Series.results", series._id, (err, results) => {
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
    'click'(event) {
      Dom.stopEvent();
      const series = Series.findById(Route.currentPageRoute.seriesId);
      const cat = $.ctx.data;

      Route.gotoPage(Tpl.CatResult, {seriesId: series._id, append: cat._id});
    },
  });

  Tpl.CatResult.$helpers({
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

      ctx.data = {climbers, events};

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

      events.sort(util.compareByField('date', -1));
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


  function sortByDate(a, b) {
    return a.date === b.date ? 0 : a.date < b.date ? 1 : -1;
  }

  return Tpl;
});
