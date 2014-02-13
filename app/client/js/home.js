var $ = Bart.current;
var Tpl = Bart.Home;
var ChooseOrg = Tpl.ChooseOrg;

AppRoute.root.addTemplate(Tpl, {
  path: "",
  data: function (page, pageRoute) {
    if (! ('orgSN' in pageRoute)) AppRoute.abortPage(ChooseOrg);
  }
});

AppRoute.root.addTemplate(ChooseOrg);
AppRoute.root.defaultPage = Tpl;


ChooseOrg.$helpers({
  orgs: function (callback) {
    AppModel.Org.find({}, {sort: {name: 1}})
      .forEach(function (doc) {callback(doc)});

    $.ctx.onDestroy(AppModel.Org.Index.observe(function (doc, old) {
      callback(doc, old, Apputil.compareByName);
    }));
  },
});
