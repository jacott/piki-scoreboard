define(function(require, exports, module) {
  var TH =        require('koru/ui/test-helper');
  var util =      require('koru/util');
  var Dom =       require('koru/dom');
  var Route =     require('koru/ui/route');
  var env =       require('koru/env');
  var subscribe = require('koru/session/subscribe');
                  require('app');
  var startup =   require('../client-startup');
  var Home =      require('ui/home');

  require('test-helper');

  var geddon = TH.geddon;

  env.onunload(module, 'reload');

  return util.reverseExtend({
    setOrg: function (org) {
      org = org || TH.Factory.createOrg();
      var orgSub = (('restore' in subscribe.intercept) ?
                    subscribe.intercept :
                    geddon.test.stub(subscribe, 'intercept'))
            .withArgs('Org');

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
    },
  }, TH);
});
