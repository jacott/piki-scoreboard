isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var Home = require('./home');
  var Route = require('koru/ui/route');
  var Dom = require('koru/dom');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test Choose org": function() {
      v.org = TH.Factory.createOrg();
      Route.gotoPage(Dom.Home);

      test.stub(Route, 'gotoPath');
      assert.dom('#ChooseOrg', function () {
        TH.click('.link', v.org.name);
      });

      assert.calledWith(Route.gotoPath, v.org.shortName);
    },

    "with org": {
      setUp: function () {
        TH.setOrg();
      },

      "test rendering": function () {
        assert.same(Route.root.defaultPage, Dom.Home);

        Route.gotoPage(Dom.Home);
        test.stub(Route, 'gotoPath');

        assert.dom('#Home', function () {
          TH.click('button.link', 'Clubs');
          assert.calledWith(Route.gotoPath, Dom.Club);

          TH.click('button.link', 'Climbers');
          assert.calledWith(Route.gotoPath, Dom.Climber);

          TH.click('button.link', 'Events');
          assert.calledWith(Route.gotoPath, Dom.Event);

          TH.click('button.link', 'Competitor categories');
          assert.calledWith(Route.gotoPath, Dom.Category);
        });
      },

      "//test climbers link": function () {
        Route.gotoPage(Dom.Home);
        TH.click('button.link', 'Climbers');

        assert.dom('#Climber');
      },

      "//test events link": function () {
        Route.gotoPage(Dom.Home);
        TH.click('button.link', 'Events');

        assert.dom('#Event');
      },
    },
  });
});
