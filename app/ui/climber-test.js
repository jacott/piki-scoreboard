isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./climber');
  var Route = require('koru/ui/route');
  var Climber = require('models/climber');
  var App = require('ui/app');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      App.setAccess();
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test rendering": function () {
      var climbers = TH.Factory.createList(2, 'createClimber');

      Route.gotoPage(sut.Index);

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

    "test adding new climber": function () {
      var club = TH.Factory.createClub();

      Route.gotoPage(sut.Index);
      test.stub(Route.history, 'back');

      assert.dom('#Climber', function () {
        TH.click('[name=addClimber]');
        assert.dom('#AddClimber', function () {
          TH.input('[name=name]', 'Magnus Midtbø');
          TH.input('[name=dateOfBirth]', '1988-09-18');
          assert.dom('[name=club_id]', function () {
            TH.change(this, club._id);
            assert.domParent('.name', 'Club');
          });

          TH.input('[name=number]', '123');

          TH.change('[name=gender]', 'm');
          TH.click('[type=submit]');
        });
        assert.called(Route.history.back);
      });

      var climber = Climber.query.where({org_id: v.org._id, name: 'Magnus Midtbø', dateOfBirth: '1988-09-18', number: 123}).fetchOne();

      assert(climber);

      assert.same(climber.club_id, club._id);
      assert.same(climber.gender, "m");
    },

    "edit": {
      setUp: function () {
        v.climber = TH.Factory.createClimber();
        v.climber2 = TH.Factory.createClimber();

        Route.gotoPage(sut.Index);

        TH.click('td', v.climber.name);
      },

      "test change name": function () {
        test.stub(Route.history, 'back');

        assert.dom('#EditClimber', function () {
          assert.dom('h1', 'Edit ' + v.climber.name);
          TH.input('[name=name]', {value: v.climber.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.called(Route.history.back);
      },

      "test delete": function () {
        assert.dom('#EditClimber', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.climber.name + '?');
          TH.click('[name=cancel');
        });

        refute.dom('.Dialog');

        assert(Climber.exists(v.climber._id));

        TH.click('#EditClimber [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditClimber');

        refute(Climber.exists(v.climber._id));
      },
    },


  });
});
