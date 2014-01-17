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
  clubs: function () {
    var row = Index.Row;
    var elm = document.createElement('tbody');
    AppModel.Club.find({org_id: App.orgId}, {sort: {name: 1}}).forEach(function (doc) {
      elm.appendChild(row.$render(doc));
    });
    return elm;
  },
});

Index.$extend({
  $created: function (ctx, elm) {
    Bart.updateOnCallback(ctx, AppModel.Club.Index.observe);
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

Tpl.Add.$events({
  'click [name=cancel]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl);
  },
  'click [type=submit]': Bart.Form.submitFunc('AddClub', Tpl),
});

Tpl.Add.$extend({});
