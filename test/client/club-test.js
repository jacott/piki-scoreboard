(function (test, v) {
  buster.testCase('client/club:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      App.orgId = v.org._id;
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      var clubs = TH.Factory.createList(2, 'createClub', function (index, options) {
        options.org_id = v.org._id;
      });
      AppRoute.gotoPage(Bart.Club.Index);

      assert.dom('#Club', function () {
        assert.dom('.clubs', function () {
          assert.dom('h1', 'Clubs');
          assert.dom('h1+table', function () {
            assert.dom('tr>td', clubs[0].name, function () {
              assert.domParent('td', clubs[0].shortName);
            });
          });
        });
        assert.dom('nav [name=addClub]', 'Add new club');
      });
    },

    "test adding new club": function () {
      AppRoute.gotoPage(Bart.Club.Index);

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
