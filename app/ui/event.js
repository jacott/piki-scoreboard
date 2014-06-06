define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./event'));
  var util  = require('koru/util');
  var env = require('koru/env');
  var Event = require('models/event');
  var Val = require('koru/model/validation');
  var Category = require('models/category');
  var Result = require('models/result');
  var Heat = require('models/heat');
  var makeSubject = require('koru/make-subject');

  var $ = Dom.current;
  var Index = Tpl.Index;

  var base = Route.root.addBase(Tpl, 'eventId');
  env.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  var Index = Tpl.Index;
  var eventSub, resultOb;

  Tpl.$extend({
    onBaseEntry: function (page, pageRoute) {
      var elm = Tpl.$autoRender({});
      document.body.appendChild(elm);

      if (pageRoute.eventId) {
        if (! Tpl.event || Tpl.event._id !== pageRoute.eventId) {
          if (Tpl.event =  Event.findById(pageRoute.eventId)) {
            observeScores();

            eventSub && eventSub.stop();
            eventSub = App.subscribe('Event', pageRoute.eventId, function () {
              Dom.removeId('Flash');
              Route.replacePath.apply(Route, loadingArgs);
            });
            Dom.Flash.loading();
            var loadingArgs = Route.loadingArgs;
            page.title = Tpl.event.name;
            Dom.setTitleLink([Tpl]);
            Route.abortPage();
          }
        }
      }

      if (! Tpl.event) Dom.addClass(elm, 'noEvent');
    },

    onBaseExit: function (page, pageRoute) {
      Dom.removeId('Event');
    },
  });

  Index.$helpers({
    events: function (callback) {
      callback.render({model: Event, sort: sortByDate});
    },
  });

  Index.Row.$helpers({
    classes: function () {
      return this.$equals(Tpl.event) ? "selected" : "";
    },
  });

  function sortByDate(a, b) {
    return a.date === b.date ? 0 : a.date < b.date ? -1 : 1;
  }

  Index.$events({
    'click .events tr': function (event) {
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Show, {eventId: data._id});
    },
  });

  base.addTemplate(Index, {defaultPage: true, path: ''});
  base.addTemplate(Tpl.Add, {
    focus: true,
    data: function () {
      return new Event({org_id: App.orgId});
    }
  });

  base.addTemplate(Tpl.Show, {
    focus: true,
    data: function (page, pageRoute) {
      if (! Tpl.event) Route.abortPage();

      Tpl.Show.results = Route.searchParams(pageRoute).type !== 'startlists';

      return Tpl.event;
    }
  });

  base.addTemplate(Tpl.Edit, {
    focus: true,
    data: function (page, pageRoute) {
      if (! Tpl.event) Route.abortPage();

      return Tpl.event;
    }
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Dom.Form.submitFunc('AddEvent', Tpl),
  });


  Tpl.Edit.$events({
    'click [name=cancel]': cancel,
    'click [name=delete]': function (event) {
      var doc = $.data();

      Dom.stopEvent();
      Dom.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Delete',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            Route.gotoPage(Tpl);
          }
        },
      });

    },
    'click [type=submit]': Dom.Form.submitFunc('EditEvent', Tpl),

    'change [name=changeFormat]': function (event) {
      var cat = $.data(this);
      var ev = Tpl.event;

      ev.$change('heats')[cat._id] = cat.type + this.value;
      if (ev.$save()) {
        Dom.Form.clearErrors(this.parentNode);
      } else {
        Dom.stopEvent();
        this.focus();
        this.select();
        Dom.Form.renderError(this.parentNode, 'changeFormat', Val.Error.msgFor(ev, 'heats'));
        ev.$reload();
      }
    },
  });

  Tpl.Edit.$helpers({
    categories: function (callback) {
      var cats = Category.docs;
      var eventCats = Object.keys(Result.eventCatIndex({event_id: Tpl.event._id})||{})
            .map(function (cat_id) {
              return cats[cat_id];
            }).sort(compareCategories)
            .forEach(function (doc) {callback(doc)});

      $.ctx.onDestroy(Result.onChange(function (doc, was) {
        if (doc && was) return;
        doc = doc && cats[doc.category_id];
        was = was && cats[was.category_id];
        (doc || was) && callback(doc && new Category(doc), was && new Category(was), compareCategories);
      }));
    },
  });

  Tpl.Edit.Cat.$helpers({
    eventFormat: eventFormat,
  });

  Tpl.CatList.$helpers({
    heats: function () {
      var cat = this;
      var frag = document.createDocumentFragment();
      var counts = Tpl.scoreCounts[cat._id];
      var heat = new Heat(-1,  Tpl.event.heats[cat._id]);
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
        elm.appendChild(Dom.Form.pageLink({
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


  Tpl.Show.$helpers({
    listType: function () {
      return Tpl.Show.results ? "results" : "start lists";
    },

    categories: function (callback) {
      var cats = Category.docs;
      var eventCats = Object.keys(Result.eventCatIndex({event_id: Tpl.event._id})||{})
            .map(function (cat_id) {
              return cats[cat_id];
            }).sort(compareCategories)
            .forEach(function (doc) {callback(doc)});

      $.ctx.onDestroy(Result.onChange(function (doc, was) {
        if (doc && was) return;
        doc = doc && cats[doc.category_id];
        was = was && cats[was.category_id];
        (doc || was) && callback(doc && new Category(doc), was && new Category(was), compareCategories);
      }));

      $.ctx.onDestroy(Tpl.scoreCounts.onChange(function (cat_id) {
        var doc = Category.findById(cat_id);
        callback(doc, doc, util.compareByName);
      }));
    },
  });

  Tpl.Show.$events({
    'click .select': function (event) {
      Dom.stopEvent();
      var me = Dom.getClosest(this, 'tr');
      var parent = event.currentTarget;
      var selected = parent.getElementsByClassName('selected');
      var action = parent.getElementsByClassName('action')[0];

      if (event.ctrlKey) {
        var on = ! Dom.hasClass(me, 'selected');
        while(selected.length) {
          Dom.removeClass(selected[0], 'selected');
        }
        Dom.setClass('selected', on, me);
      } else if (event.shiftKey) {
        var elm = me.nextSibling;
        while(elm && ! Dom.hasClass(elm, 'selected'))
          elm = elm.nextSibling;

        if (elm) for(elm = elm.previousSibling;elm !== me; elm = elm.previousSibling) {
          Dom.addClass(elm, 'selected');
        }
        var elm = me.previousSibling;
        while(elm && ! Dom.hasClass(elm, 'selected'))
          elm = elm.previousSibling;

        if (elm) for(elm = elm.nextSibling;elm !== me; elm = elm.nextSibling) {
          Dom.addClass(elm, 'selected');
        }
        Dom.addClass(me, 'selected');
      } else {
        Dom.toggleClass(me, 'selected');
      }

      me = (Dom.hasClass(me, 'selected') ? me : selected[0]);

      var firstFormat = me && Tpl.event.heatTypes($.data(me)._id);

      if (firstFormat) {
        for(var i = 0; i < selected.length; ) {
          if (Tpl.event.heatTypes($.data(selected[i])._id) !== firstFormat)
            Dom.removeClass(selected[i], 'selected');
          else
            ++i;
        }
      }
      Dom.getCtx(action).updateAllTags({fmt: firstFormat});
    },

    'click .printResults': function (event) {
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
    $created: function (ctx) {
      Dom.autoUpdate(ctx);
    },
  });

  Tpl.Show.Action.$helpers({
    content: function () {
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

  function eventFormat() {
    var event = $.ctx.parentCtx.data;
    return event.heats[this._id].slice(1);
  }

  function observeScores() {
    resultOb && resultOb.stop();

    var counts = Tpl.scoreCounts = {};

    makeSubject(counts);

    resultOb = Result.onChange(calcScores);

    var docs = Result.docs;
    for(var id in docs)
      calcScores(docs[id], null);

    function calcScores(doc, was) {
      var res = doc || was;
      if (res.event_id !== Tpl.event._id) return;

      var oldScores = (doc ? doc.$asBefore(was) : was).scores || [];
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
