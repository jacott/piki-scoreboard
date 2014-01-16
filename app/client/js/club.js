var Tpl = Bart.Club;
var elm;

Tpl.$extend({
  onBaseEntry: function () {
    elm = Tpl.$autoRender({});

    document.body.appendChild(elm);
    var ctx = Bart.getCtx(elm);
  },

  onBaseExit: function () {
    Bart.remove(elm);
    elm = null;
  },
});


var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});
base.addTemplate(Tpl.Add, {
  data: function () {
    return new AppModel.Club();
  }
});
