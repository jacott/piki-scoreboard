var Tpl = Bart.SystemSetup;

AppRoute.addTemplate(Tpl);
AppRoute.addTemplate(Tpl.AddOrg, {
  data: function () {
    return new AppModel.Org();
  }
});

Tpl.$events({
  'click [name=addOrg]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl.AddOrg);
  },
});

Tpl.AddOrg.$events({
  'click [type=submit]': function (event) {
    event.$actioned = true;

    var elm = document.getElementById('AddOrg');
    var ctx = Bart.getCtx(elm);
    var doc = ctx.data;

    if (Bart.Form.saveDoc(doc, elm.querySelector('.fields'))) {
      AppRoute.gotoPage(Tpl);
    }
  },
});
