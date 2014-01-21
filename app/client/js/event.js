var $ = Bart.current;
var Tpl = Bart.Event;
var Index = Tpl.Index;

var elm;

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('Event');
  },
});

Index.$helpers({
  events: function (callback) {
    AppModel.Event.find({}, {sort: {date: 1}})
      .forEach(function (doc) {callback(doc)});

    return AppModel.Event.Index.observe(function (doc, old) {
      callback(doc, old, sortByDate);
    });
  },
});

function sortByDate(a, b) {
  return a.date === b.date ? 0 : a.date < b.date ? -1 : 1;
}

Index.$events({
  'click .events tr': function (event) {
    event.$actioned = true;

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Show, {append: data._id});
  },
});

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Index, {defaultPage: true});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Event({org_id: App.orgId});
  }
});

var selectedEvent = {
  focus: true,
  data: function (page, location) {
    var m = /([^/]*)$/.exec(location.pathname);
    var doc = AppModel.Event.findOne(m[1]);

    if (!doc) AppRoute.abortPage(Tpl);

    return doc;
  }
};

['Show', 'Edit', 'Register'].forEach(function (name) {
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

    event.$actioned = true;
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

function cancel(event) {
  event.$actioned = true;
  AppRoute.gotoPage(Tpl);
}
