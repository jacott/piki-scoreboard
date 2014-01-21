var $ = Bart.current;
var Tpl = Bart.Club;
var Index = Tpl.Index;

var elm;

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('Club');
  },
});

Index.$helpers({
  clubs: function (callback) {
    AppModel.Club.find({}, {sort: {name: 1}})
      .forEach(function (doc) {callback(doc)});

    return AppModel.Club.Index.observe(function (doc, old) {
      callback(doc, old, sortByName);
    });
  },
});

function sortByName(a, b) {
  return a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
}

Index.$events({
  'click .clubs tr': function (event) {
    event.$actioned = true;

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Edit, {append: data._id});
  },
});

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Index, {defaultPage: true});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Club({org_id: App.orgId});
  }
});

base.addTemplate(Tpl.Edit, {
  focus: true,
  data: function (page, location) {
    var m = /([^/]*)$/.exec(location.pathname);
    var doc = AppModel.Club.findOne(m[1]);

    if (!doc) AppRoute.abortPage(Tpl);

    return doc;
  }
});

Tpl.Add.$events({
  'click [name=cancel]': cancel,
  'click [type=submit]': Bart.Form.submitFunc('AddClub', Tpl),
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
  'click [type=submit]': Bart.Form.submitFunc('EditClub', Tpl),
});

function cancel(event) {
  event.$actioned = true;
  AppRoute.gotoPage(Tpl);
}
