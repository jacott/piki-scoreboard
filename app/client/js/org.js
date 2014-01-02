var Tpl = Bart.Org;
var elm;

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {defaultPage: true});


App.extend(Tpl, {
  onBaseEntry: function (location) {
    var shortName = location.pathname.split('/')[1];

    elm = Tpl.$autoRender({});
    document.body.appendChild(elm);
    Bart.getCtx(elm).onDestroy(App.subscribe('Org', shortName, function () {
      var doc = AppModel.Org.findOne({initials: shortName});
      Tpl.id = doc._id;
      document.querySelector('#header [name=connect]').textContent = doc.name;
    }));
  },

  onBaseExit: function () {
    Bart.remove(elm);
  },
});
