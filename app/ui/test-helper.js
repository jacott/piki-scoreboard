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
      var orgSub = TH.stubSubscribe('Org');

      Route.replacePage(Home, {orgSN: org.shortName});

      assert.calledWith(subscribe.intercept, 'Org', TH.match(function (handle) {
        handle.callback();
        return true;
      }));
      return orgSub;
    },

    tearDown: function () {
      Route.replacePage();
      TH.domTearDown();
      TH.clearDB();
      util.thread.userId = null;
    },
  }, TH);
});
