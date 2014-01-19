(function (test, v) {
  buster.testCase('client/climber:', {
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
      var climbers = TH.Factory.createList(2, 'createClimber');

      AppRoute.gotoPage(Bart.Climber.Index);

      assert.dom('#Climber', function () {
        assert.dom('.climbers', function () {
          assert.dom('h1', 'Climbers');
          assert.dom('h1+table', function () {
            assert.dom('tr>td', climbers[0].name, function () {
              assert.domParent('td', climbers[0].shortName);
            });
            assert.dom('tr>td', climbers[1].name, function () {
              assert.domParent('td', climbers[1].shortName);
            });
          });
        });
        assert.dom('nav [name=addClimber]', 'Add new climber');
      });
    },

    "//test adding new climber": function () {
      var club = TH.Factory.createClub();
      AppRoute.gotoPage(Bart.Climber.Index);

      assert.dom('#Climber', function () {
        TH.click('[name=addClimber]');
        assert.dom('#AddClimber', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.change('[name=club]', club._id);
          TH.click('[type=submit]');
        });
        refute.dom('#AddClimber');
      });

      assert(AppModel.User.exists({org_id: v.org._id, role: 'c', name: 'Dynomites Wellington', shortName: 'WGTN'}));

      assert.dom('#Climber [name=addClimber]');
    },

    "edit": {
      setUp: function () {
        v.climber = TH.Factory.createClimber();
        v.climber2 = TH.Factory.createClimber();

        AppRoute.gotoPage(Bart.Climber.Index);

        TH.click('td', v.climber.name);
      },

      "//test change name": function () {
        assert.dom('#EditClimber', function () {
          assert.dom('h1', 'Edit ' + v.climber.name);
          TH.input('[name=name]', {value: v.climber.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Climber td', 'new name');
      },

      "//test delete": function () {
        assert.dom('#EditClimber', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.climber.name + '?');
          TH.click('[name=cancel');
        });

        refute.dom('.Dialog');

        assert(AppModel.User.exists(v.climber._id));

        TH.click('#EditClimber [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditClimber');

        refute(AppModel.User.exists(v.climber._id));
      },
    },
  });
})();
