define(function(require, exports, module) {
  const koru  = require('koru');
  const Dom   = require('koru/dom');
  const Route = require('koru/ui/route');
  const util  = require('koru/util');
  const Org   = require('models/org');
  const App   = require('./app-base');

  const Tpl = module.exports = Dom.newTemplate(require('koru/html!./choose-org'));
  const $ = Dom.current;

  Route.root.addTemplate(module, Tpl);

  Tpl.$helpers({
    orgs(each) {
      return {
        query: Org.query,
        compare: util.compareByName
      };
    },
  });

  Tpl.$events({
    'click .link'(event) {
      Dom.stopEvent();
      const org = $.data(this);
      Route.gotoPath(`/#${org.shortName}/event`);
    },
  });
});
