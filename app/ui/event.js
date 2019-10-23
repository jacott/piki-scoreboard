define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const DocChange       = require('koru/model/doc-change');
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
  const EventSub        = require('pubsub/event-sub');
  const EventHelper     = require('ui/event-helper');
  const PrintHelper     = require('ui/print-helper');
  const SeriesTpl       = require('ui/series');
  const SpeedEvent      = require('ui/speed-event');
  const App             = require('./app');

  const Tpl   = Dom.newTemplate(require('koru/html!./event'));
  const $ = Dom.current;
  const {Index} = Tpl;
  const sortByDate = util.compareByField('date', -1);

  Route.root.defaultPage = Index;

  const heatOrderType = (catId)=>{
    const type = Tpl.event.heats[catId];
    return type === undefined
      ? undefined
      : type[0] === 'S' ? 'S' : type;
  };

  const compareCategories = (a, b)=>{
    const ai = a._id, bi = b._id;
    if (ai === bi) return 0;
    var ac, bc;
    if (((ac = heatOrderType(ai)) === (bc = heatOrderType(bi))) &&
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

  const base = Route.root.addBase(module, Tpl, {routeVar: 'eventId'});
  base.async = true;
  module.onUnload(()=>{
    Tpl.event = null;
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
      if (Dom.tpl.Event.Register !== undefined && Dom.tpl.Event.Register.$contains(page))
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
        const thisType = heatOrderType(doc._id);
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

    const calcScores = dc =>{
      const {doc, was} = dc;
      if (doc.event_id !== (Tpl.event && Tpl.event._id)) return;

      const oldScores = (! dc.isAdd && was.scores) || [];
      const newScores = (! dc.isDelete && doc.scores) || [];

      const len = Math.max(oldScores.length, newScores.length);
      const {category_id} = doc;
      const scores = counts[category_id] || (counts[category_id]  = []);
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
        counts.notify(category_id);
      }
    };

    resultOb = Result.onChange(calcScores);

    const docs = Result.docs;
    for (let id in docs)
      calcScores(DocChange.add(docs[id]));
  };

  Tpl.$extend({
    base,
    onBaseEntry: (page, pageRoute, callback)=>{
      const elm = Tpl.$autoRender({});
      pageRoute.eventId &&
        Dom.myCtx(elm).onDestroy(Event.observeId(
          pageRoute.eventId, dc => Dom.setTitle(dc.doc.displayName)));

      base.childAnchor = elm.querySelector('#EventBody');

      Route.childAnchor.appendChild(elm);
      const currentSub = eventSub;

      const pageTitle = document.getElementById('PageTitle');
      if (pageTitle)
        pageTitle.href = `#${pageRoute.orgSN}/event/${pageRoute.eventId}/show`;

      if (pageRoute.eventId) {
        if (! Tpl.event || Tpl.event._id !== pageRoute.eventId) {
          if (Tpl.event =  Event.findById(pageRoute.eventId)) {
            observeScores();

            eventSub && eventSub.stop();
            eventSub = EventSub.subscribe(pageRoute.eventId, ()=>{callback()});
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
    'click .list tbody>tr'(event) {
      Dom.stopEvent();

      const data = $.data(this);

      if ($.ctx.tab === 'series')
        Route.gotoPath('series/'+data._id);
      else
        Route.gotoPage(Tpl.Show, {eventId: data._id});
    },

    'click button:not(.selected).tab'(event) {
      Dom.stopEvent();

      Route.gotoPage(Tpl.Index, {hash: '#'+this.getAttribute('name')});
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
      Dom.tpl.Dialog.confirm({
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
      ctx.onEventChange = Event.observeId(this._id, ()=>{
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
            return Result.onChange(dc =>{
              if (dc.isChange) return;
              body(dc.clone()._set(cats[dc.doc.category_id]));
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
    },

    disableSpeed() {
      Dom.setBoolean('disabled', this.type === 'S');
    },

    describeFormat() {
      const event = $.ctx.parentCtx.data;
      return Event.describeFormat(event.heats[this._id] || this.type+this.heatFormat);
    }
  });

  const {SPEED_FINAL_NAME} = EventHelper;

  const renderSpeedHeats = (cat, type) =>{
    const frag = document.createDocumentFragment();
    const isResults = Tpl.Show.results;

    const format = Tpl.event.attributes.heats[cat._id];
    const start = format[1] === 'C' ? 2 : 1;

    frag.appendChild(createHeatTD('Quals', cat, type, 0));

    for (let i = start; i < format.length; ++i) {
      const heat = format[i];
      frag.appendChild(createHeatTD(SPEED_FINAL_NAME[heat], cat, type, heat));
    }

    const elm = document.createElement('td');
    elm.setAttribute('colspan', 5 - format.length + start);
    frag.appendChild(elm);


    return frag;
  };

  const createHeatTD = (name, cat, type, heatNumber)=>{
    const elm = document.createElement('td');
    elm.appendChild(Form.pageLink({
      value: name, template: "Event.Category", append: cat._id,
      search: type + "&heat=" + heatNumber,
    }));
    return elm;
  };

  Tpl.CatList.$helpers({
    catID() {
      return "cat_"+this._id;
    },

    heats() {
      const cat = this;
      const type = listType();
      if (cat.type === 'S') {
        return renderSpeedHeats(cat, type);
      }
      const frag = document.createDocumentFragment();
      const counts = Tpl.scoreCounts[cat._id] || [];
      const format = Tpl.event.heats[cat._id] || cat.type + cat.heatFormat;
      const heat = new Heat(-1,  format);
      let total = heat.total;
      if (Tpl.Show.results) ++total;

      const addHeat = (i)=>{frag.appendChild(createHeatTD(heat.getName(i), cat, type, i))};

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

      $.ctx.onDestroy(Result.onChange(dc =>{
        dc.isChange || buildTable(table); // else already showing this row
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

      const fmt = me && heatOrderType($.data(me)._id);

      if (fmt != null) {
        for(let i = 0; i < selected.length; ) {
          if (heatOrderType($.data(selected[i])._id) !== fmt)
            Dom.removeClass(selected[i], 'selected');
          else
            ++i;
        }
      }
      Dom.ctx(action).updateAllTags({fmt, selected});
    }),

    'click .printResults'(event) {
      Dom.stopEvent();
      const heatNumber = +this.getAttribute('data-heat');
      const parent = event.currentTarget;
      const selected = parent.getElementsByClassName('selected');

      const elm = document.createElement('section');
      elm.className = 'print-only';
      const ev = Tpl.event;
      const {heats} = ev;
      for(let i = 0; i < selected.length; ++i) {
        const category = $.data(selected[i]);

        if (category.type === 'S' && heatNumber > 0) {
          const fmt = heats[category._id];
          let found = false;
          for(let i = fmt.length; i > 0; --i) {
            const code = fmt[i];
            if (heatNumber == 1 || +code == heatNumber) {
              found = true; break;
            }
          }
          if (! found) continue;
        }
        const template = category.type === 'S' ? SpeedEvent : Tpl.Category;
        elm.appendChild(template.$render({
          event_id: ev._id,
          showingResults: Tpl.Show.results, heatNumber: heatNumber,
          category}));
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
      if (this.fmt != null) {
        const frag = document.createDocumentFragment();
        const elm = document.createElement('span');
        elm.textContent = "Print ";
        frag.appendChild(elm);

        const addButton = (number, name)=>{
          if (number < -1 || number === 99) return;
          const elm = document.createElement('button');
          elm.textContent = name;
          elm.setAttribute('data-heat', number);
          elm.className = "link printResults";
          frag.appendChild(elm);
        };


        Tpl.Show.results && addButton(-1, 'General');
        if (this.fmt === 'S') {
          addButton(0, 'Quals');
          const formats = [];
          for (const elm of this.selected) {
            const fmt = Tpl.event.heats[$.data(elm)._id];
            for(let i = fmt.length - 1; i > 0; --i) {
              const code = +fmt[i];
              formats[code] = true;
            }
          }
          for (let i = formats.length; i >= 0 ; --i) {
            formats[i] && addButton(i, SPEED_FINAL_NAME[i]);
          }

        } else {
          new Heat(-1, this.fmt).headers(addButton);
        }

        return frag;
      } else
        return "Select categories to print";
    },
  });

  return Tpl;
});
