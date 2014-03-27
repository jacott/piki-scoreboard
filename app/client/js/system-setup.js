var $ = Bart.current;
var Tpl = Bart.SystemSetup;

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});
base.addTemplate(Tpl.OrgForm, {
  data: function (page, pageRoute) {
    return AppModel.Org.findOne(pageRoute.append) || new AppModel.Org();
  }
});
base.addTemplate(Tpl.UserForm, {
  data: function (page, pageRoute) {
    return AppModel.User.findOne(pageRoute.append) || new AppModel.User({org_id: App.orgId});
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
    Bart.stopEvent();
    AppRoute.history.back();
  },

  'click [name=delete]': function (event) {
    var doc = $.data(event.currentTarget.querySelector('form'));

    Bart.stopEvent();
    Bart.Dialog.confirm({
      data: doc,
      classes: 'warn',
      okay: 'Delete',
      content: Tpl.ConfirmDelete,
      callback: function(confirmed) {
        if (confirmed) {
          doc.$remove();
          AppRoute.replacePath(Tpl);
        }
      },
    });

  },

  'click .orgs tr': function (event) {
    if (! Bart.hasClass(document.body, 'sAccess')) return;
    Bart.stopEvent();

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.OrgForm, {append: data._id});
  },

  'click .users tr': function (event) {
    Bart.stopEvent();

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.UserForm, {append: data._id});
  },
});



Tpl.OrgForm.$events({
  'click [type=submit]': Bart.Form.submitFunc('OrgForm', Tpl),
});

Tpl.UserForm.$helpers({
  orgList: function () {
    return AppModel.Org.find({}, {sort: {name: 1}}).fetch();
  },

  roleList: function () {
    var su = AppModel.User.me().isSuperUser();
    var role =  AppModel.User.ROLE;
    var results = [];
    for(var name in role) {
      if (su || name !== 'superUser')
        results.push([role[name], Apputil.capitalize(Apputil.humanize(name))]);
    }
    return results;
  },
});

Tpl.UserForm.$events({
  'click [type=submit]': Bart.Form.submitFunc('UserForm', Tpl),
});
