define(function(require, exports, module) {
  const koru        = require('koru');
  const Dom         = require('koru/dom');
  const makeSubject = require('koru/make-subject');
  const Val         = require('koru/model/validation');
  const Form        = require('koru/ui/form');
  const Route       = require('koru/ui/route');
  const util        = require('koru/util');
  const Category    = require('models/category');
  const Event       = require('models/event');
  const Heat        = require('models/heat');
  const Result      = require('models/result');
  const Series      = require('models/series');
  const TeamType    = require('models/team-type');
  const PrintHelper = require('ui/print-helper');
  const SeriesTpl   = require('ui/series');
  const App         = require('./app-base');

  const Tpl   = Dom.newTemplate(require('koru/html!./event'));
  const $ = Dom.current;
  const Index = Route.root.defaultPage = Tpl.Index;


  koru.onunload(module, function () {
    Route.root.defaultPage = null;
  });

  Dom.registerHelpers({
    lazySeriesList() {
      return function () {
        return Series.query.fetch().sort(util.compareByName);
      };
    },
  });

  const base = Route.root.addBase(module, Tpl, 'eventId');
  base.async = true;
  koru.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  let eventSub, resultOb;

  Tpl.$extend({
    base,
    onBaseEntry(page, pageRoute, callback) {
      var elm = Tpl.$autoRender({});
      pageRoute.eventId &&
        Dom.myCtx(elm).onDestroy(Event.observeId(pageRoute.eventId, doc => Dom.setTitle(doc && doc.displayName)));

      document.body.appendChild(elm);
      const currentSub = eventSub;

      const pageTitle = document.getElementById('PageTitle');
      if (pageTitle)
        pageTitle.href = `#${pageRoute.orgSN}/event/${pageRoute.eventId}/show`;

      if (pageRoute.eventId) {
        if (! Tpl.event || Tpl.event._id !== pageRoute.eventId) {
          if (Tpl.event =  Event.findById(pageRoute.eventId)) {
            observeScores();

            eventSub && eventSub.stop();
            eventSub = App.subscribe('Event', pageRoute.eventId, function () {
              callback();
            });
          }
        }
      }

      if (Tpl.event) {
        pageRoute.eventId = Tpl.event._id;
        Route.title = Tpl.event.displayName;
      } else
        Dom.addClass(elm, 'noEvent');

      if (eventSub === currentSub)
        callback();

      Tpl.stopNotify = Route.onChange(pageChange).stop;
      pageChange(page, pageRoute);
    },

    onBaseExit(page, pageRoute) {
      Tpl.stopNotify && Tpl.stopNotify();
      Dom.removeId('Event');
      Route.title = null;
    },

    stop() {
      eventSub && eventSub.stop();
      Tpl.event = null;
    },
  });

  function pageChange(page, pageRoute) {
    const tabList = Dom('#Event>div>nav.tabbed');
    const old = tabList.getElementsByClassName('selected')[0];

    Dom.removeClass(old, "selected");


    const query = `button[name="${page.name}"]`;
    let button = page.parent === Tpl && tabList.querySelector(
      pageRoute.search ? `${query}[data-search="${pageRoute.search}"]` : query
    );

    if (! button) {
      if (Dom.Event.Register.$contains(page))
        button =  tabList.querySelector('[name="Register"]');
    }

    Dom.setClass('hide', ! button, tabList);
    Dom.addClass(button, "selected");
  }

  Tpl.$events({
    'click .tabNames>button'(event) {
      Dom.stopEvent();
      const opts = {};
      const search =  this.getAttribute('data-search');
      if (search) opts.search = search;
      Route.gotoPage(Tpl[this.getAttribute('name')], opts);
    },
  });

  Index.$helpers({
    list(callback) {
      callback.render({model: $.ctx.tab === 'series' ? Series : Event, sort: sortByDate});
    },

    addLink() {
      return Form.pageLink({
        class: 'adminAccess action', name: 'add',
        value: 'Add new '+$.ctx.tab,
        template: $.ctx.tab === 'series' ? 'Event.AddSeries' : 'Event.Add'});
    },

    selectedTab(type) {
      Dom.setClass("selected", type === $.ctx.tab);
      Dom.addClass($.element, type);
    },
  });

  Index.Row.$helpers({
    classes() {
      return this === Tpl.event ? "selected" : "";
    },
  });

  function sortByDate(a, b) {
    return a.date === b.date ? 0 : a.date < b.date ? 1 : -1;
  }

  Index.$events({
    'click .list tr'(event) {
      Dom.stopEvent();

      var data = $.data(this);

      if ($.ctx.tab === 'series')
        Route.gotoPath('series/'+data._id);
      else
        Route.gotoPage(Tpl.Show, {eventId: data._id});
    },

    'click button:not(.selected).tab'(event) {
      Dom.stopEvent();

      Route.replacePage(Tpl.Index, {hash: '#'+this.getAttribute('name')});
    },
  });

  Index.$extend({
    title: "Calendar",
    $created(ctx, elm) {
      ctx.tab = (ctx.data.hash || '#event').slice(1);
      ctx.data = {};
    }
  });

  base.addTemplate(module, Index, {
    defaultPage: true,
    path: '',
    data: (page, pageRoute) => pageRoute,
  });
  base.addTemplate(module, Tpl.Add, {
    focus: true,
    data() {
      return new Event({org_id: App.orgId, teamType_ids: TeamType.where('default', true).fetchIds()});
    }
  });
  base.addTemplate(module, Tpl.AddSeries, {
    focus: true,
    data() {
      return new Series({org_id: App.orgId, teamType_ids: TeamType.where('default', true).fetchIds()});
    }
  });

  base.addTemplate(module, Tpl.Show, {
    focus: true,
    data(page, pageRoute) {
      if (! Tpl.event) Route.abortPage();

      Tpl.Show.results = Route.searchParams(pageRoute).type !== 'startlists';

      return Tpl.event;
    }
  });

  base.addTemplate(module, Tpl.Edit, {
    focus: true,
    data(page, pageRoute) {
      if (! Tpl.event) Route.abortPage();

      return Tpl.event;
    }
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddEvent', 'back'),
  });

  Tpl.AddSeries.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddSeries', 'back'),
  });


  Tpl.Edit.$events({
    'click [name=cancel]': cancel,
    'click [name=delete]'(event) {
      var doc = $.data();

      Dom.stopEvent();
      Dom.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Delete',
        content: Tpl.ConfirmDelete,
        callback(confirmed) {
          if (confirmed) {
            doc.$remove();
            Route.gotoPage(Tpl);
          }
        },
      });

    },
    'click [type=submit]': Form.submitFunc('EditEvent', Tpl),

    'change [name=changeFormat]'(event) {
      var cat = $.data(this);
      var ev = Tpl.event;

      ev.$change('heats')[cat._id] = cat.type + this.value;
      if (ev.$save()) {
        Form.clearErrors(this.parentNode);
      } else {
        Dom.stopEvent();
        this.focus();
        this.select();
        Form.renderError(this.parentNode, 'changeFormat', Val.Error.msgFor(ev, 'heats'));
        ev.$reload();
      }
    },
  });

  Tpl.Edit.$helpers({
    categories(callback) {
      var cats = Category.docs;
      var eventCats = catList()
            .forEach(function (doc) {doc && callback(doc)});

      function catList() {
        return Object.keys(Result.eventCatIndex({event_id: Tpl.event._id})||{})
          .map(function (cat_id) {
              return cats[cat_id];
            }).sort(compareCategories);
      }

      $.ctx.onDestroy(Event.onChange(function (doc, was) {
        doc = doc || was;
        if (doc._id !== Tpl.event._id) return;
        catList().forEach(function (doc) {
          callback(doc, doc, compareCategories);
        });
      }));


      $.ctx.onDestroy(Result.onChange(function (doc, was) {
        if (doc && was) return;
        (doc || was) && callback(doc && cats[doc.category_id], was && cats[was.category_id], compareCategories);
      }));
    },
  });

  Tpl.Form.$helpers({
    seriesName() {
      const series = this.series;
      return series && series.name;
    },
  });

  Tpl.Edit.$extend({
    $destroyed(ctx, elm) {
      ctx.data.$clearChanges();
    }
  });

  Tpl.Edit.Cat.$helpers({
    eventFormat() {
    var event = $.ctx.parentCtx.data;
    var format = event.heats[this._id];
    if (format)
      return format.slice(1);
    else
      return this.heatFormat; // not yet copied to event
    } ,
    describeFormat() {
      var event = $.ctx.parentCtx.data;
      return Event.describeFormat(event.heats[this._id] || this.type+this.heatFormat);
    }
  });

  Tpl.CatList.$helpers({
    catID() {
      return "cat_"+this._id;
    },

    heats() {
      var cat = this;
      var frag = document.createDocumentFragment();
      var counts = Tpl.scoreCounts[cat._id] || [];
      var format = Tpl.event.heats[cat._id];
      if (! format) format = cat.type + cat.heatFormat;
      var heat = new Heat(-1,  format);
      var total = heat.total;
      if (Tpl.Show.results) ++total;

      for(var i = 1; i < total && counts[i]; ++i) {
        addHeat(i);
      }
      if (! Tpl.Show.results) {
        addHeat(i);
        var link = $.data($.element.previousElementSibling.firstChild);
        link.search += "&heat="+i;
      }

      if (i < 7) {
        var elm = document.createElement('td');
        elm.setAttribute('colspan', 7 - i);
        frag.appendChild(elm);
      }


      return frag;

      function addHeat(i) {
        var elm = document.createElement('td');
        elm.appendChild(Form.pageLink({
          value: heat.getName(i), template: "Event.Category", append: cat._id,
          search: listType() + "&heat="+i,
        }));
        frag.appendChild(elm);
      }
    },

    listType: listType,
  });

  function listType() {
    return "type=" + (Tpl.Show.results ? "results" : "startlists");
  }

  const FORMAT_ROW = Dom.h({class: 'fmt', tr: {td: '', $colspan: 8}});

  function buildTable(table) {
    var cats = Category.docs;
    var lastType, lastStyle;
    Dom.removeChildren(table);
    Object.keys(Result.eventCatIndex({event_id: Tpl.event._id})||{})
      .map(function (cat_id) {
        return cats[cat_id];
      }).sort(compareCategories)
      .forEach(function (doc) {
        if (! doc) return;
        var thisType = Tpl.event.heatTypes(doc._id);
        if (lastType !== thisType) {
          lastType = thisType;
          var fr = FORMAT_ROW.cloneNode(true);
          if (lastStyle !== thisType[0]) {
            lastStyle = thisType[0];
            Dom.addClass(fr, lastStyle);
          }
          fr.firstChild.textContent = "Format: " + Event.describeFormat(thisType);
          table.appendChild(fr);
        }
        table.appendChild(Tpl.CatList.$autoRender(doc));
      });
  }

  Tpl.Show.$helpers({
    listType() {
      return Tpl.Show.results ? "results" : "start lists";
    },

    eachCategory() {
      if ($.element.tagName === 'TABLE') {
        buildTable($.element);
        return;
      }

      var table = document.createElement('table');
      Dom.addClass(table, 'categories');


      buildTable(table);

      $.ctx.onDestroy(Result.onChange(function (doc, was) {
        if (doc && was) return; // already showing this row
        buildTable(table);
      }));

      $.ctx.onDestroy(Tpl.scoreCounts.onChange(function (cat_id) {
        var elm = document.getElementById('cat_'+cat_id);
        elm && Dom.getMyCtx(elm).updateAllTags();
      }));

      return table;
    },
  });

  Tpl.Show.$events({
    'click .select': PrintHelper.clickSelect(function (me, selected, parent) {
      const action = parent.getElementsByClassName('action')[0];

      const firstFormat = me && Tpl.event.heatTypes($.data(me)._id);

      if (firstFormat) {
        for(let i = 0; i < selected.length; ) {
          if (Tpl.event.heatTypes($.data(selected[i])._id) !== firstFormat)
            Dom.removeClass(selected[i], 'selected');
          else
            ++i;
        }
      }
      Dom.getCtx(action).updateAllTags({fmt: firstFormat});
    }),

    'click .printResults'(event) {
      Dom.stopEvent();
      var heatNumber = +this.getAttribute('data-heat');
      var parent = event.currentTarget;
      var selected = parent.getElementsByClassName('selected');


      var elm = document.createElement('section');
      elm.className = 'print-only';
      for(var i = 0; i < selected.length; ++i) {
        elm.appendChild(Tpl.Category.$render({showingResults: Tpl.Show.results, heatNumber: heatNumber, category_id: $.data(selected[i])._id}));
      }
      parent.parentNode.appendChild(elm);
      Dom.addClass(parent, 'no-print');

      window.print();

      Dom.remove(elm);
      Dom.removeClass(parent, 'no-print');
    },
  });

  Tpl.Show.$extend({
    $created(ctx) {
      Tpl.Show.titleSuffix = Tpl.Show.results ? 'Results' : 'Start lists';
      Dom.autoUpdate(ctx);
    },
  });

  Tpl.Show.Action.$helpers({
    content() {
      if (this.fmt) {
        var frag = document.createDocumentFragment();
        var elm = document.createElement('span');
        elm.textContent = "Print ";
        frag.appendChild(elm);

        Tpl.Show.results && heat(-1, 'General');

        new Heat(-1, this.fmt).headers(heat);

        return frag;
      } else
        return "Select categories to print";

      function heat(number, name) {
        if (number < -1 || number === 99) return;
        var elm = document.createElement('button');
        elm.textContent = name;
        elm.setAttribute('data-heat', number);
        elm.className = "link printResults";
        frag.appendChild(elm);
      }
    },
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.history.back();
  }

  function observeScores() {
    resultOb && resultOb.stop();

    const counts = Tpl.scoreCounts = {};

    makeSubject(counts);

    resultOb = Result.onChange(calcScores);

    const docs = Result.docs;
    for (let id in docs)
      calcScores(docs[id], null);

    function calcScores(doc, was) {
      var res = doc || was;
      if (res.event_id !== (Tpl.event && Tpl.event._id)) return;

      var oldScores = (was && (doc ? doc.$withChanges(was) : was).scores) || [];
      var newScores = (doc && doc.scores) || [];

      var len = Math.max(oldScores.length, newScores.length);
      var scores = counts[res.category_id] || (counts[res.category_id]  = []);
      var changed = false;

      for(var i = 0; i < len; ++i) {
        var count = (newScores[i] != null ?
                     (oldScores[i] == null ? 1 : 0) :
                     (oldScores[i] != null ? -1 : 0));
        if (count) {
          changed = true;
          scores[i] = (scores[i] || 0) + count;
        }
      }

      if (changed) {
        counts.notify(res.category_id);
      }
    }
  }

  function compareCategories(a, b) {
    if (a._id === b._id) return 0;
    var ac, bc;
    if (((ac = Tpl.event.heatTypes(a._id)) === (bc = Tpl.event.heatTypes(b._id))) &&
        ((ac = a.group) === (bc = b.group)) &&
        ((ac = a.name) === (bc = b.name)))
      return 0;

    return ac < bc ? -1 : 1;
  }

  return Tpl;
});
