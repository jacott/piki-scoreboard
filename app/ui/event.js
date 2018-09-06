define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Val             = require('koru/model/validation');
  const Observable      = require('koru/observable');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Category        = require('models/category');
  const Event           = require('models/event');
  const Heat            = require('models/heat');
  const Result          = require('models/result');
  const Series          = require('models/series');
  const TeamType        = require('models/team-type');
  const PrintHelper     = require('ui/print-helper');
  const SeriesTpl       = require('ui/series');
  const App             = require('./app');

  const Tpl   = Dom.newTemplate(require('koru/html!./event'));
  const $ = Dom.current;
  const {Index} = Tpl;
  const sortByDate = util.compareByField('date', -1);

  Route.root.defaultPage = Index;

  const compareCategories = (a, b)=>{
    const ai = a._id, bi = b._id;
    if (ai === bi) return 0;
    var ac, bc;
    if (((ac = Tpl.event.heatTypes(ai)) === (bc = Tpl.event.heatTypes(bi))) &&
        ((ac = a.group) === (bc = b.group)) &&
        ((ac = a.name) === (bc = b.name))) {
      return ai < bi ? -1 : 1;
    }
    return ac < bc ? -1 : 1;
  };
  compareCategories.compareKeys = ['group', 'name', '_id'];

  Dom.registerHelpers({
    lazySeriesList: () => () => Series.query.fetch().sort(util.compareByName)
  });

  const base = Route.root.addBase(module, Tpl, 'eventId');
  base.async = true;
  module.onUnload(()=>{
    Route.root.defaultPage = null;
    Route.root.removeBase(Tpl);
  });

  let eventSub, resultOb;

  const pageChange = (page, pageRoute)=>{
    const tabList = Dom('#Event>div>nav.tabbed');
    const old = tabList.getElementsByClassName('selected')[0];

    Dom.removeClass(old, "selected");

    const query = `button[name="${page.name}"]`;
    let button = page.parent === Tpl
        ? tabList.querySelector(
          pageRoute.search ? `${query}[data-search="${pageRoute.search}"]` : query)
        : null;

    if (! button) {
      if (Dom.Event.Register.$contains(page))
        button =  tabList.querySelector('[name="Register"]');
    }

    Dom.setClass('hide', ! button, tabList);
    Dom.addClass(button, "selected");
  };

  const listType = ()=>{
    return "type=" + (Tpl.Show.results ? "results" : "startlists");
  };

  const FORMAT_ROW = Dom.h({class: 'fmt', tr: {td: '', $colspan: 8}});

  const buildTable = (table)=>{
    const cats = Category.docs;
    let lastType, lastStyle;
    Dom.removeChildren(table);
    Object.keys(Result.eventCatIndex.lookup({event_id: Tpl.event._id})||{})
      .map(cat_id => cats[cat_id]).sort(compareCategories)
      .forEach(doc =>{
        if (doc == null) return;
        const thisType = Tpl.event.heatTypes(doc._id);
        if (lastType !== thisType) {
          lastType = thisType;
          const fr = FORMAT_ROW.cloneNode(true);
          if (lastStyle !== thisType[0]) {
            lastStyle = thisType[0];
            Dom.addClass(fr, lastStyle);
          }
          fr.firstChild.textContent = "Format: " + Event.describeFormat(thisType);
          table.appendChild(fr);
        }
        table.appendChild(Tpl.CatList.$autoRender(doc));
      });
  };

  const cancel = (event)=>{
    Dom.stopEvent();
    Route.history.back();
  };

  const observeScores = ()=>{
    resultOb && resultOb.stop();

    const counts = Tpl.scoreCounts = new Observable();

    const calcScores = (doc, was)=>{
      const res = doc || was;
      if (res.event_id !== (Tpl.event && Tpl.event._id)) return;

      const oldScores = (was && (doc ? doc.$withChanges(was) : was).scores) || [];
      const newScores = (doc && doc.scores) || [];

      const len = Math.max(oldScores.length, newScores.length);
      const scores = counts[res.category_id] || (counts[res.category_id]  = []);
      let changed = false;

      for(let i = 0; i < len; ++i) {
        const count = (newScores[i] != null ?
                       (oldScores[i] == null ? 1 : 0) :
                       (oldScores[i] != null ? -1 : 0));
        if (count != 0) {
          changed = true;
          scores[i] = (scores[i] || 0) + count;
        }
      }

      if (changed) {
        counts.notify(res.category_id);
      }
    };

    resultOb = Result.onChange(calcScores);

    const docs = Result.docs;
    for (let id in docs)
      calcScores(docs[id], null);
  };

  Tpl.$extend({
    base,
    onBaseEntry: (page, pageRoute, callback)=>{
      const elm = Tpl.$autoRender({});
      pageRoute.eventId &&
        Dom.myCtx(elm).onDestroy(Event.observeId(
          pageRoute.eventId, doc => Dom.setTitle(doc && doc.displayName)));

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
            eventSub = App.subscribe('Event', pageRoute.eventId, ()=>{callback()});
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

    onBaseExit: (page, pageRoute)=>{
      Tpl.stopNotify && Tpl.stopNotify();
      Dom.removeId('Event');
      Route.title = null;
    },

    stop: ()=>{
      eventSub && eventSub.stop();
      Tpl.event = null;
    },
  });

  Tpl.$events({
    'click .tabNames>button:not(.selected)'(event) {
      const tpl = Tpl[this.getAttribute('name')];
      if (tpl === undefined) return;
      Dom.stopEvent();
      const opts = {};
      const search =  this.getAttribute('data-search');
      if (search) opts.search = search;
      Route.gotoPage(tpl, opts);
    },
  });

  Index.$helpers({
    list(each) {
      return {
        query: ($.ctx.tab === 'series' ? Series : Event).query,
        compare: sortByDate,
        updateAllTags: true,
      };
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

  Index.$events({
    'click .list tr'(event) {
      Dom.stopEvent();

      const data = $.data(this);

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

  App.restrictAccess(Tpl.Edit);

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
      const doc = $.data();

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
      const cat = $.data(this);
      const ev = Tpl.event;

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
    categories(each) {
      const cats = Category.docs;

      const {ctx} = $;

      ctx.onEventChange == null || ctx.onEventChange.stop();
      ctx.onEventChange = Event.observeId(this._id, (doc, undo)=>{
        each.list.changeOptions({updateAllTags: true});
      });

      return {
        query: {
          forEach: body =>{
            for (const cat_id in Result.eventCatIndex.lookup({event_id: this._id})) {
              body(cats[cat_id]);
            }
          },
          onChange: body => {
            return Result.onChange((doc, was)=>{
              if (doc && was) return;
              body(doc && cats[doc.category_id], was && cats[was.category_id]);
            });
          },
          compare: compareCategories,
        }
      };
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
      ctx.onEventChange && ctx.onEventChange.stop();
      ctx.onEventChange = null;
      ctx.data.$clearChanges();
    }
  });

  Tpl.Edit.Cat.$helpers({
    eventFormat() {
    const event = $.ctx.parentCtx.data;
    const format = event.heats[this._id];
    if (format)
      return format.slice(1);
    else
      return this.heatFormat; // not yet copied to event
    } ,
    describeFormat() {
      const event = $.ctx.parentCtx.data;
      return Event.describeFormat(event.heats[this._id] || this.type+this.heatFormat);
    }
  });

  Tpl.CatList.$helpers({
    catID() {
      return "cat_"+this._id;
    },

    heats() {
      const cat = this;
      const frag = document.createDocumentFragment();
      const counts = Tpl.scoreCounts[cat._id] || [];
      const format = Tpl.event.heats[cat._id] || cat.type + cat.heatFormat;
      const heat = new Heat(-1,  format);
      let total = heat.total;
      if (Tpl.Show.results) ++total;

      const addHeat = (i)=>{
        const elm = document.createElement('td');
        elm.appendChild(Form.pageLink({
          value: heat.getName(i), template: "Event.Category", append: cat._id,
          search: listType() + "&heat="+i,
        }));
        frag.appendChild(elm);
      };

      let i = 1;
      for(; i < total && counts[i]; ++i) {
        addHeat(i);
      }
      if (! Tpl.Show.results) {
        addHeat(i);
        $.data($.element.previousElementSibling.firstChild).search += "&heat="+i;
      }

      if (i < 7) {
        const elm = document.createElement('td');
        elm.setAttribute('colspan', 7 - i);
        frag.appendChild(elm);
      }


      return frag;
    },

    listType,
  });

  Tpl.Show.$helpers({
    listType() {
      return Tpl.Show.results ? "results" : "start lists";
    },

    eachCategory() {
      if ($.element.tagName === 'TABLE') {
        buildTable($.element);
        return;
      }

      const table = document.createElement('table');
      Dom.addClass(table, 'categories');


      buildTable(table);

      $.ctx.onDestroy(Result.onChange((doc, was)=>{
        if (doc && was) return; // already showing this row
        buildTable(table);
      }));

      $.ctx.onDestroy(Tpl.scoreCounts.onChange((cat_id)=>{
        const elm = document.getElementById('cat_'+cat_id);
        elm === null || Dom.myCtx(elm).updateAllTags();
      }));

      return table;
    },
  });

  Tpl.Show.$events({
    'click .select': PrintHelper.clickSelect((me, selected, parent)=>{
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
      Dom.ctx(action).updateAllTags({fmt: firstFormat});
    }),

    'click .printResults'(event) {
      Dom.stopEvent();
      const heatNumber = +this.getAttribute('data-heat');
      const parent = event.currentTarget;
      const selected = parent.getElementsByClassName('selected');


      const elm = document.createElement('section');
      elm.className = 'print-only';
      for(let i = 0; i < selected.length; ++i) {
        elm.appendChild(Tpl.Category.$render({
          showingResults: Tpl.Show.results, heatNumber: heatNumber,
          category_id: $.data(selected[i])._id}));
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
      ctx.autoUpdate();
    },
  });

  Tpl.Show.Action.$helpers({
    content() {
      if (this.fmt) {
        const frag = document.createDocumentFragment();
        const elm = document.createElement('span');
        elm.textContent = "Print ";
        frag.appendChild(elm);

        const heat = (number, name)=>{
          if (number < -1 || number === 99) return;
          const elm = document.createElement('button');
          elm.textContent = name;
          elm.setAttribute('data-heat', number);
          elm.className = "link printResults";
          frag.appendChild(elm);
        };

        Tpl.Show.results && heat(-1, 'General');

        new Heat(-1, this.fmt).headers(heat);

        return frag;
      } else
        return "Select categories to print";
    },
  });

  return Tpl;
});
