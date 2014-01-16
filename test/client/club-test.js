(function (test, v) {
  buster.testCase('client/club:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      App.orgId = v.org._id;
      AppRoute.gotoPage(Bart.Club.Index);
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      assert.dom('#Club', function () {
        assert.dom('[name=addClub]', 'Add new club');
      });
    },

    "test adding new club": function () {
      assert.dom('#Club', function () {
        TH.click('[name=addClub]');
        assert.dom('#AddClub', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'Wgtn');
          TH.click('[type=submit]');
        });
        refute.dom('#AddClub');
      });

      assert(AppModel.Club.exists({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'Wgtn'}));

      assert.dom('#Club [name=addClub]');
    },
  });
})();
