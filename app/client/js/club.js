var Tpl = Bart.Club;
var elm;

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('Club');
  },
});


var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});
base.addTemplate(Tpl.Add, {
  data: function () {
    return new AppModel.Club({org_id: App.orgId});
  }
});

Tpl.Add.$events({
  'click [type=submit]': Bart.Form.submitFunc('AddClub', Tpl),
});
