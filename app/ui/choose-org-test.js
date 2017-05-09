isClient && define(function (require, exports, module) {
  const Dom          = require('koru/dom');
  const localStorage = require('koru/local-storage');
  const Route        = require('koru/ui/route');
  const Event        = require('ui/event');
  const Climber      = require('./climber');
  const TH           = require('./test-helper');

  const sut = require('./choose-org');
  var v;

  TH.testCase(module, {
    setUp() {
      v = {};
      TH.loginAs(TH.Factory.createUser('guest'));
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test Choose org"() {
      localStorage.removeItem('orgSN');
      v.org = TH.Factory.createOrg();

      Route.gotoPage(sut);

      this.stub(Route, 'gotoPath');
      assert.dom('#ChooseOrg', function () {
        TH.click('.link', v.org.name);
      });

      assert.calledWith(Route.gotoPath, `/#${v.org.shortName}/event`);
    },
  });
});
