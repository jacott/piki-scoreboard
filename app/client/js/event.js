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
  events: function () {
    var row = Index.Row;
    var elm = document.createElement('tbody');
    AppModel.Event.find({org_id: App.orgId}, {sort: {date: 1}}).forEach(function (doc) {
      elm.appendChild(row.$render(doc));
    });
    return elm;
  },
});

Index.$events({
  'click .events tr': function (event) {
    event.$actioned = true;

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Show, {append: data._id});
  },
});

Index.$extend({
  $created: function (ctx, elm) {
    Bart.updateOnCallback(ctx, AppModel.Event.Index.observe);
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
