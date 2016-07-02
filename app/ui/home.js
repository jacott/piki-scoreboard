define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Org   = require('models/org');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./home'));
  var util  = require('koru/util');
  var koru = require('koru');

  var $ = Dom.current;
  var ChooseOrg = Tpl.ChooseOrg;

  koru.onunload(module, function () {
    Route.root.removeTemplate(Tpl, {path: ""});
    Route.root.removeTemplate(ChooseOrg);
    Route.root.defaultPage = null;
  });

  Route.root.addTemplate(module, Tpl, {
    path: "",
    data: function (page, pageRoute) {
      if (! App.org()) Route.abortPage(ChooseOrg);
    }
  });

  Route.root.addTemplate(module, ChooseOrg);
  Route.root.defaultPage = Tpl;

  ChooseOrg.$helpers({
    orgs: function (callback) {
      callback.render({model: Org, sort: util.compareByName});
    },
  });

  return Tpl;
});
