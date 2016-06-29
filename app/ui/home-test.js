isClient && define(function (require, exports, module) {
  var test, v;
  const Dom     = require('koru/dom');
  const Route   = require('koru/ui/route');
  const Event   = require('ui/event');
  const Climber = require('./climber');
  const Home    = require('./home');
  const TH      = require('./test-helper');

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
      Route.gotoPage(Dom.Home);

      test.stub(Route, 'gotoPath');
      assert.dom('#ChooseOrg', function () {
        TH.click('.link', v.org.name);
      });

      assert.calledWith(Route.gotoPath, v.org.shortName);
    },

    "with org": {
      setUp() {
        TH.setOrg();
      },

      "test rendering"() {
        assert.same(Route.root.defaultPage, Dom.Home);

        Route.gotoPage(Dom.Home);
        test.stub(Route, 'gotoPath');

        assert.dom('#Home', function () {
          TH.click('button.link', 'Teams');
          assert.calledWith(Route.gotoPath, Dom.Team);

          TH.click('button.link', 'Climbers');
          assert.calledWith(Route.gotoPath, Dom.Climber);

          TH.click('button.link', 'Events');
          assert.calledWith(Route.gotoPath, Dom.Event);

          TH.click('button.link', 'Competitor categories');
          assert.calledWith(Route.gotoPath, Dom.Category);
        });
      },

      "test climbers link"() {
        Route.gotoPage(Dom.Home);
        TH.click('button.link', 'Climbers');

        assert.dom('#Climber');
      },

      "test events link"() {
        Route.gotoPage(Dom.Home);
        TH.click('button.link', 'Events');

        assert.dom('#Event');
      },
    },
  });
});
