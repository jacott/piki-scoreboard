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

  ChooseOrg.$extend({
    title: 'Choose organization',
  });

  ChooseOrg.$helpers({
    orgs: function (callback) {
      callback.render({model: Org, sort: util.compareByName});
    },
  });

  ChooseOrg.$events({
    'click .link'(event) {
      Dom.stopEvent();
      const org = $.data(this);
      Route.gotoPath(`/#${org.shortName}/event`);
    },
  });

  return Tpl;
});
