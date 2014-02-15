var $ = Bart.current;
var Tpl = Bart.Climber;
var Index = Tpl.Index;

var elm;

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('Climber');
  },
});

Index.$helpers({
  climbers: function (callback) {
    callback.render({model: AppModel.Climber, sort: Apputil.compareByName});
  },
});

Index.$events({
  'click .climbers tr': function (event) {
    event.$actioned = true;

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Edit, {climberId: data._id});
  },
});

Tpl.Form.$helpers({
  clubList: function () {
    return AppModel.Club.find({}, {sort: {name: 1}}).map(function (doc) {
      return [doc._id, doc.name];
    });
  },
});

Tpl.Add.$events({
  'click [name=cancel]': cancel,
  'click [type=submit]': Bart.Form.submitFunc('AddClimber', Tpl),
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
  'click [type=submit]': Bart.Form.submitFunc('EditClimber', Tpl),
});

var base = AppRoute.root.addBase(Tpl, 'climberId');
base.addTemplate(Index, {defaultPage: true, path: ''});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Climber({org_id: App.orgId});
  }
});

base.addTemplate(Tpl.Edit, {
  focus: true,
  data: function (page, pageRoute) {
    var doc = AppModel.Climber.findOne(pageRoute.climberId);

    if (!doc) AppRoute.abortPage();

    return doc;
  }
});

function cancel(event) {
  event.$actioned = true;
  AppRoute.gotoPage(Tpl);
}
