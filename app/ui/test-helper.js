define(function(require, exports, module) {
  var TH =        require('koru/ui/test-helper');
  var util =      require('koru/util');
  var Dom =       require('koru/dom');
  var Route =     require('koru/ui/route');
  var env =       require('koru/env');
  var subscribe = require('koru/session/subscribe');
  var App =       require('./app');
  var Home =      require('ui/home');

  require('test-helper');

  var geddon = TH.geddon;

  env.onunload(module, 'reload');

  return TH = util.reverseExtend({
    setAccess: App.setAccess, // used by TH.loginAs

    stubSubscribe: function (name) {
      return (('restore' in subscribe.intercept) ?
       subscribe.intercept :
       geddon.test.stub(subscribe, 'intercept'))
        .withArgs(name);
    },

    setOrg: function (org) {
      org = org || TH.Factory.createOrg();
      App.orgId = org._id;
      Dom.addClass(document.body, 'inOrg');
      App._setOrgShortName(org.shortName);

      Route.replacePage(Home, {orgSN: org.shortName});
    },

    tearDown: function () {
      Route.replacePage();
      TH.domTearDown();
      TH.clearDB();
      util.thread.userId = null;
    },
  }, TH);
});
