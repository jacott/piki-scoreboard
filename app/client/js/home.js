var $ = Bart.current;
var Tpl = Bart.Home;
var ChooseOrg = Tpl.ChooseOrg;

AppRoute.root.addTemplate(Tpl, {
  path: "",
  data: function (page, pageRoute) {
    if (! App.org()) AppRoute.abortPage(ChooseOrg);
  }
});

AppRoute.root.addTemplate(ChooseOrg);
AppRoute.root.defaultPage = Tpl;


ChooseOrg.$helpers({
  orgs: function (callback) {
    callback.render({model: AppModel.Org, sort: Apputil.compareByName});
  },
});
