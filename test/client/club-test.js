(function (test, v) {
  buster.testCase('client/club:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      TH.setOrg(v.org);
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      var clubs = TH.Factory.createList(2, 'createClub');

      AppRoute.gotoPage(Bart.Club.Index);

      assert.dom('#Club', function () {
        assert.dom('.clubs', function () {
          assert.dom('h1', 'Clubs');
          assert.dom('h1+table', function () {
            assert.dom('tr>td', clubs[0].name, function () {
              assert.domParent('td', clubs[0].shortName);
            });
            assert.dom('tr>td', clubs[1].name, function () {
              assert.domParent('td', clubs[1].shortName);
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

      assert(AppModel.Club.exists({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'WGTN'}));

      assert.dom('#Club [name=addClub]');
    },

    "edit": {
      setUp: function () {
        v.club = TH.Factory.createClub();
        v.club2 = TH.Factory.createClub();

        AppRoute.gotoPage(Bart.Club.Index);

        TH.click('td', v.club.name);
      },

      "test change name": function () {
        assert.dom('#EditClub', function () {
          assert.dom('h1', 'Edit ' + v.club.name);
          TH.input('[name=name]', {value: v.club.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Club td', 'new name');
      },

      "test delete": function () {
        assert.dom('#EditClub', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.club.name + '?');
          TH.click('[name=cancel');
        });

        refute.dom('.Dialog');

        assert(AppModel.Club.exists(v.club._id));

        TH.click('#EditClub [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditClub');

        refute(AppModel.Club.exists(v.club._id));
      },
    },
  });
})();
