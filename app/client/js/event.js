var $ = Bart.current;
var Tpl = Bart.Event;
var ShowCat = Tpl.Show.Cat;
var Index = Tpl.Index;
var eventSub;

Tpl.$extend({
  onBaseEntry: function (page, pageRoute) {
    var elm = Tpl.$autoRender({});
    document.body.appendChild(elm);

    if (pageRoute.eventId) {
      if (! Tpl.event || Tpl.event._id !== pageRoute.eventId) {
        if (Tpl.event =  AppModel.Event.findOne(pageRoute.eventId)) {

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
    eventSub && eventSub.stop();
    Tpl.event = eventSub = null;
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

var selectedEvent = {
  focus: true,
  data: function (page, pageRoute) {
    if (! Tpl.event) AppRoute.abortPage();

    return Tpl.event;
  }
};

['Show', 'Edit'].forEach(function (name) {
  base.addTemplate(Tpl[name], selectedEvent);
});

selectedEvent = null;

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
      classes: 'small warn',
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
});

Tpl.Show.$helpers({
  categories: function (callback) {
    var cats = AppModel.Category.attrDocs();
    var eventCats = Object.keys(AppModel.Result.eventCatIndex({event_id: Tpl.event._id})||{})
          .map(function (cat_id) {
            return cats[cat_id];
          }).sort(Apputil.compareByName)
          .forEach(function (doc) {callback(doc)});

    $.ctx.onDestroy(AppModel.Result.Index.observe(function (doc, old) {
      if (doc && old) return;
      doc = doc && cats[doc.category_id];
      old = old && cats[old.category_id];
      (doc || old) && callback(doc && new AppModel.Category(doc), old && new AppModel.Category(old), Apputil.compareByName);
    }));
  },
});

Tpl.Show.$extend({
  $created: function (ctx) {
    Bart.autoUpdate(ctx);
  },
});

ShowCat.$helpers({
  eventFormat: eventFormat,
});

ShowCat.$events({
  'click [name=format]': function (event) {
    Bart.stopEvent();

    this.parentNode.insertBefore(ShowCat.ChangeFormat.$autoRender($.ctx.data, $.ctx.parentCtx), this);
  },
});

ShowCat.ChangeFormat.$helpers({
  format: eventFormat,
});

ShowCat.ChangeFormat.$events({
  'submit': function (event) {
    Bart.stopEvent();

    var cat = $.data(this);

    var ev = $.ctx.parentCtx.data;

    ev.$change('heats')[cat._id] = cat.type + this.querySelector('input').value;
    if (ev.$save())
      Bart.remove(this);
    else {
      Bart.Form.renderError(this, 'changeFormat', AppVal.Error.msgFor(ev, 'heats'));
      ev.$reload();
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

App.loaded('Bart.Event', Bart.Event);
