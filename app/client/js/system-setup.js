var $ = Bart.current;
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

Tpl.$helpers({
  org: function () {
    return App.org();
  },

  orgList: function (callback) {
    callback.render({model: AppModel.Org, sort: Apputil.compareByName});
  },

  userList: function (callback) {
    callback.render({model: AppModel.User, sort: Apputil.compareByName});
  },
});



Tpl.$events({
  'click [name=cancel]': function (event) {
    event.$actioned = true;
    AppRoute.history.back();
  },
});



Tpl.AddOrg.$events({
  'click [type=submit]': Bart.Form.submitFunc('AddOrg', Tpl),
});

Tpl.AddUser.$helpers({
  orgList: function () {
    return AppModel.Org.find({}, {sort: {name: 1}}).fetch();
  },
});

Tpl.AddUser.$events({
  'click [type=submit]': Bart.Form.submitFunc('AddUser', Tpl),
});
