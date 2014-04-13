var $ = Bart.current;
var Tpl = Bart.Event;
var Index = Tpl.Index;
var eventSub, resultOb;

Tpl.$extend({
  onBaseEntry: function (page, pageRoute) {
    var elm = Tpl.$autoRender({});
    document.body.appendChild(elm);

    if (pageRoute.eventId) {
      if (! Tpl.event || Tpl.event._id !== pageRoute.eventId) {
        if (Tpl.event =  AppModel.Event.findOne(pageRoute.eventId)) {
          observeScores();

          eventSub && eventSub.stop();
          eventSub = App.subscribe('Event', pageRoute.eventId, function () {
            Bart.removeId('Flash');
            AppRoute.replacePath.apply(AppRoute, loadingArgs);
          });
          Bart.Flash.loading();
          var loadingArgs = AppRoute.loadingArgs;
          page.title = Tpl.event.name;
          Bart.setTitleLink([Tpl]);
          AppRoute.abortPage();
        }
      }
    }

    if (! Tpl.event) Bart.addClass(elm, 'noEvent');
  },

  onBaseExit: function (page, pageRoute) {
    Bart.removeId('Event');
  },
});

Index.$helpers({
  events: function (callback) {
    callback.render({model: AppModel.Event, sort: sortByDate});
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
    Bart.stopEvent();

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Show, {eventId: data._id});
  },
});

var base = AppRoute.root.addBase(Tpl, 'eventId');

base.addTemplate(Index, {defaultPage: true, path: ''});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Event({org_id: App.orgId});
  }
});

base.addTemplate(Tpl.Show, {
  focus: true,
  data: function (page, pageRoute) {
    if (! Tpl.event) AppRoute.abortPage();

    Tpl.Show.results = AppRoute.searchParams(pageRoute).type !== 'startlists';

    return Tpl.event;
  }
});

base.addTemplate(Tpl.Edit, {
  focus: true,
  data: function (page, pageRoute) {
    if (! Tpl.event) AppRoute.abortPage();

    return Tpl.event;
  }
});

Tpl.Add.$events({
  'click [name=cancel]': cancel,
  'click [type=submit]': Bart.Form.submitFunc('AddEvent', Tpl),
});


Tpl.Edit.$events({
  'click [name=cancel]': cancel,
  'click [name=delete]': function (event) {
    var doc = $.data();

    Bart.stopEvent();
    Bart.Dialog.confirm({
      data: doc,
      classes: 'warn',
      okay: 'Delete',
      content: Tpl.ConfirmDelete,
      callback: function(confirmed) {
        if (confirmed) {
          doc.$remove();
          AppRoute.gotoPage(Tpl);
        }
      },
    });

  },
  'click [type=submit]': Bart.Form.submitFunc('EditEvent', Tpl),

  'change [name=changeFormat]': function (event) {
    var cat = $.data(this);
    var ev = Tpl.event;

    ev.$change('heats')[cat._id] = cat.type + this.value;
    if (ev.$save()) {
      Bart.Form.clearErrors(this.parentNode);
    } else {
      Bart.stopEvent();
      this.focus();
      this.select();
      Bart.Form.renderError(this.parentNode, 'changeFormat', AppVal.Error.msgFor(ev, 'heats'));
      ev.$reload();
    }
  },
});

Tpl.Edit.$helpers({
  categories: function (callback) {
    var cats = AppModel.Category.attrDocs();
    var eventCats = Object.keys(AppModel.Result.eventCatIndex({event_id: Tpl.event._id})||{})
          .map(function (cat_id) {
            return cats[cat_id];
          }).sort(compareCategories)
          .forEach(function (doc) {callback(doc)});

    $.ctx.onDestroy(AppModel.Result.Index.observe(function (doc, old) {
      if (doc && old) return;
      doc = doc && cats[doc.category_id];
      old = old && cats[old.category_id];
      (doc || old) && callback(doc && new AppModel.Category(doc), old && new AppModel.Category(old), compareCategories);
    }));
  },
});

Tpl.Edit.Cat.$helpers({
  eventFormat: eventFormat,
});

Tpl.CatList.$helpers({
  heats: function () {
    var frag = document.createDocumentFragment();
    var counts = Tpl.scoreCounts[this._id];
    var heat = new AppModel.Heat(-1,  Tpl.event.heats[this._id]);

    for(var i = 1; counts[i]; ++i) {
      var elm = document.createElement('td');
      elm.appendChild(Bart.Form.pageLink({value: heat.getName(i), template: "Event.Category", append: this._id,
                                          search: listType() + "&heat="+i}));
      frag.appendChild(elm);
    }
    if (i < 7) {
      var elm = document.createElement('td');
      elm.setAttribute('colspan', 7 - i);
      frag.appendChild(elm);
    }


    return frag;
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
    var cats = AppModel.Category.attrDocs();
    var eventCats = Object.keys(AppModel.Result.eventCatIndex({event_id: Tpl.event._id})||{})
          .map(function (cat_id) {
            return cats[cat_id];
          }).sort(compareCategories)
          .forEach(function (doc) {callback(doc)});

    $.ctx.onDestroy(AppModel.Result.Index.observe(function (doc, old) {
      if (doc && old) return;
      doc = doc && cats[doc.category_id];
      old = old && cats[old.category_id];
      (doc || old) && callback(doc && new AppModel.Category(doc), old && new AppModel.Category(old), compareCategories);
    }));

    $.ctx.onDestroy(Tpl.scoreCounts.onChange(function (cat_id) {
      var doc = AppModel.Category.quickFind(cat_id);
      callback(doc, doc, Apputil.compareByName);
    }));
  },
});

Tpl.Show.$events({
  'click .select': function (event) {
    Bart.stopEvent();
    var me = Bart.getClosest(this, 'tr');
    var parent = event.currentTarget;
    var selected = parent.getElementsByClassName('selected');
    var action = parent.getElementsByClassName('action')[0];

    if (event.ctrlKey) {
      var on = ! Bart.hasClass(me, 'selected');
      while(selected.length) {
        Bart.removeClass(selected[0], 'selected');
      }
      Bart.setClass('selected', on, me);
    } else if (event.shiftKey) {
      var elm = me.nextSibling;
      while(elm && ! Bart.hasClass(elm, 'selected'))
        elm = elm.nextSibling;

      if (elm) for(elm = elm.previousSibling;elm !== me; elm = elm.previousSibling) {
        Bart.addClass(elm, 'selected');
      }
      var elm = me.previousSibling;
      while(elm && ! Bart.hasClass(elm, 'selected'))
        elm = elm.previousSibling;

      if (elm) for(elm = elm.nextSibling;elm !== me; elm = elm.nextSibling) {
        Bart.addClass(elm, 'selected');
      }
      Bart.addClass(me, 'selected');
    } else {
      Bart.toggleClass(me, 'selected');
    }

    me = (Bart.hasClass(me, 'selected') ? me : selected[0]);

    var firstFormat = me && Tpl.event.heatTypes($.data(me)._id);

    if (firstFormat) {
      for(var i = 0; i < selected.length; ) {
        if (Tpl.event.heatTypes($.data(selected[i])._id) !== firstFormat)
          Bart.removeClass(selected[i], 'selected');
        else
          ++i;
      }
    }
    Bart.getCtx(action).updateAllTags({fmt: firstFormat});
  },

  'click .printResults': function (event) {
    Bart.stopEvent();
    var heatNumber = +this.getAttribute('data-heat');
    var parent = event.currentTarget;
    var selected = parent.getElementsByClassName('selected');


    var elm = document.createElement('section');
    for(var i = 0; i < selected.length; ++i) {
      elm.appendChild(Tpl.Category.$render({showingResults: Tpl.Show.results, heatNumber: heatNumber, category_id: $.data(selected[i])._id}));
    }
    parent.parentNode.appendChild(elm);
    Bart.addClass(parent, 'no-print');

    window.print();

    Bart.remove(elm);
    Bart.removeClass(parent, 'no-print');
  },
});

Tpl.Show.$extend({
  $created: function (ctx) {
    Bart.autoUpdate(ctx);
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

      new AppModel.Heat(-1, this.fmt).headers(heat);

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
  Bart.stopEvent();
  AppRoute.history.back();
}

function eventFormat() {
  var event = $.ctx.parentCtx.data;
  return event.heats[this._id].slice(1);
}

function observeScores() {
  resultOb && resultOb.stop();

  var counts = Tpl.scoreCounts = {};

  App.makeSubject(counts);

  resultOb = AppModel.Result.Index.observe(calcScores);

  var docs = AppModel.Result.attrDocs();
  for(var id in docs)
    calcScores(docs[id], null);

  function calcScores(doc, old) {
    var res = doc || old;
    if (res.event_id !== Tpl.event._id) return;

    var oldScores = (old && old.scores) || [];
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

App.loaded('Bart.Event', Bart.Event);
