(function (test, v) {
  buster.testCase('client/home:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test Choose org": function() {
      v.org = TH.Factory.createOrg();
      AppRoute.gotoPage(Bart.Home);

      test.stub(AppRoute, 'gotoPath');
      assert.dom('#ChooseOrg', function () {
        TH.click('.link', v.org.name);
      });

      assert.calledWith(AppRoute.gotoPath, v.org.shortName);
    },

    "with org": {
      setUp: function () {
        TH.setOrg();
      },

      "test rendering": function () {
        assert.same(AppRoute.root.defaultPage, Bart.Home);

        AppRoute.gotoPage(Bart.Home);
        test.stub(AppRoute, 'gotoPath');

        assert.dom('#Home', function () {
          TH.click('button.link', 'Clubs');
          assert.calledWith(AppRoute.gotoPath, Bart.Club);

          TH.click('button.link', 'Climbers');
          assert.calledWith(AppRoute.gotoPath, Bart.Climber);

          TH.click('button.link', 'Events');
          assert.calledWith(AppRoute.gotoPath, Bart.Event);

          TH.click('button.link', 'Event categories');
          assert.calledWith(AppRoute.gotoPath, Bart.Category);
        });
      },

      "test climbers link": function () {
        AppRoute.gotoPage(Bart.Home);
        TH.click('button.link', 'Climbers');

        assert.dom('#Climber');
      },

      "test events link": function () {
        AppRoute.gotoPage(Bart.Home);
        TH.click('button.link', 'Events');

        assert.dom('#Event');
      },
    },
  });
})();
