isClient && define((require, exports, module) => {
  const Dom             = require('koru/dom');
  const localStorage    = require('koru/local-storage');
  const Route           = require('koru/ui/route');
  const Climber         = require('./climber');
  const TH              = require('./test-helper');
  const Factory         = require('test/factory');
  const Event           = require('ui/event');

  const {stub, spy, after} = TH;

  const sut = require('./choose-org');

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test}) => {
    beforeEach(() => {
      TH.startTransaction();
      TH.loginAs(Factory.createUser('guest'));
    });

    afterEach(() => {
      TH.domTearDown();
      TH.rollbackTransaction();
    });

    test('Choose org', () => {
      localStorage.removeItem('orgSN');
      const org = Factory.createOrg();

      Route.gotoPage(sut);

      stub(Route, 'gotoPath');
      assert.dom('#ChooseOrg', () => {
        TH.click('.link', org.name);
      });

      assert.calledWith(Route.gotoPath, `/#${org.shortName}/event`);
    });
  });
});
