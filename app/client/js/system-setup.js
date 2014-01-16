var Tpl = Bart.SystemSetup;

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});
base.addTemplate(Tpl.AddOrg, {
  data: function () {
    return new AppModel.Org();
  }
});
base.addTemplate(Tpl.AddUser, {
  data: function () {
    return new AppModel.User({org_id: App.orgId});
  }
});


Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('SystemSetup');
  },
});

Tpl.$events({
  'click [name=addOrg]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl.AddOrg);
  },

  'click [name=addUser]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl.AddUser);
  },
  'click [name=cancel]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl);
  },
});

Tpl.AddOrg.$events({
  'click [type=submit]': Bart.Form.submitFunc('AddOrg', Tpl),
});

Tpl.AddUser.$events({
  'click [type=submit]': Bart.Form.submitFunc('AddUser', Tpl),
});
