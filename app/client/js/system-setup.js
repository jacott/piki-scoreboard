var Tpl = Bart.SystemSetup;

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});
base.addTemplate(Tpl.AddOrg, {
  data: function () {
    return new AppModel.Org();
  }
});


App.extend(Tpl, {
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.remove(document.getElementById('SystemSetup'));
  },
});

Tpl.$events({
  'click [name=addOrg]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl.AddOrg);
  },
});

Tpl.AddOrg.$events({
  'click [name=cancel]': function (event) {
    event.$actioned = true;
    AppRoute.gotoPage(Tpl);
  },
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
