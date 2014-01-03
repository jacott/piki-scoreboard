var Tpl = Bart.SystemSetup;
var elm;

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});
base.addTemplate(Tpl.AddOrg, {
  data: function () {
    return new AppModel.Org();
  }
});
base.addTemplate(Tpl.AddUser, {
  data: function () {
    return new AppModel.User();
  }
});


App.extend(Tpl, {
  onBaseEntry: function () {
    elm = Tpl.$autoRender({});
    document.body.appendChild(elm);
    Bart.getCtx(elm).onDestroy(App.subscribe('AllOrgs'));
  },

  onBaseExit: function () {
    Bart.remove(elm);
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
  'click [type=submit]': subFunc('AddOrg'),
});

Tpl.AddUser.$events({
  'click [type=submit]': subFunc('AddUser'),
});


function subFunc(elmId) {
  return function (event) {
    event.$actioned = true;

    var elm = document.getElementById(elmId);
    var ctx = Bart.getCtx(elm);
    var doc = ctx.data;

    if (Bart.Form.saveDoc(doc, elm.querySelector('.fields'))) {
      AppRoute.gotoPage(Tpl);
    }
  };
}
