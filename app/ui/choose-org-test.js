isClient && define(function (require, exports, module) {
  var test, v;
  const Dom     = require('koru/dom');
  const Route   = require('koru/ui/route');
  const Event   = require('ui/event');
  const Climber = require('./climber');
  const TH      = require('./test-helper');

  const sut = require('./choose-org');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      TH.loginAs(TH.Factory.createUser('guest'));
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test Choose org"() {
      v.org = TH.Factory.createOrg();
      Route.gotoPage(sut);

      test.stub(Route, 'gotoPath');
      assert.dom('#ChooseOrg', function () {
        TH.click('.link', v.org.name);
      });

      assert.calledWith(Route.gotoPath, `/#${v.org.shortName}/event`);
    },
  });
});
