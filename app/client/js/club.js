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
    callback.render({model: AppModel.Club, sort: Apputil.compareByName});
  },
});

Index.$events({
  'click .clubs tr': function (event) {
    if (! Bart.hasClass(document.body, 'aAccess')) return;
    Bart.stopEvent();

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Edit, {clubId: data._id});
  },
});

var base = AppRoute.root.addBase(Tpl, 'clubId');
base.addTemplate(Index, {defaultPage: true, path: ''});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Club({org_id: App.orgId});
  }
});

base.addTemplate(Tpl.Edit, {
  focus: true,
  data: function (page, pageRoute) {
    var doc = AppModel.Club.findOne(pageRoute.clubId);

    if (!doc) AppRoute.abortPage();

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
  'click [type=submit]': Bart.Form.submitFunc('EditClub', Tpl),
});

function cancel(event) {
  Bart.stopEvent();
  AppRoute.gotoPage(Tpl);
}
