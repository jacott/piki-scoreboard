isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./team');
  var Route = require('koru/ui/route');
  var Team = require('models/team');
  var App = require('ui/app');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      TH.Factory.createTeamType({_id: 'tt1', name: 'type 1'});
      App.setAccess();
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
      sut.teamType_id = null;
    },

    "test rendering": function () {
      var teams = TH.Factory.createList(2, 'createTeam');
      TH.Factory.createTeamType();
      var other = TH.Factory.createTeam();

      Route.gotoPage(sut.Index);

      assert.dom('#Team', function () {
        TH.selectMenu('[name=teamType_id]', TH.match.field('id', 'tt1'));
        assert.dom('[name=teamType_id]', 'type 1');
        assert.dom('.teams', function () {
          assert.dom('h1', 'Teams');
          assert.dom('h1+table', function () {
            assert.dom('tr', {count: 3});
            assert.dom('tr>td', teams[0].name, function () {
              assert.domParent('td', teams[0].shortName);
            });
            assert.dom('tr>td', teams[1].name, function () {
              assert.domParent('td', teams[1].shortName);
            });
          });
        });
        assert.dom('nav [name=addTeam]', 'Add new team');
      });
    },

    "test adding new team": function () {
      Route.gotoPage(sut.Index);

      TH.selectMenu('#Team [name=teamType_id]', TH.match.field('id', 'tt1'));
      assert.dom('#Team', function () {
        TH.click('[name=addTeam]');
        assert.dom('#AddTeam', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'Wgtn');
          TH.click('[type=submit]');
        });
        refute.dom('#AddTeam');
      });

      assert(Team.exists({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'Wgtn', teamType_id: 'tt1'}));

      assert.dom('#Team [name=addTeam]');
    },

    "edit": {
      setUp: function () {
        v.team = TH.Factory.createTeam();
        v.team2 = TH.Factory.createTeam();

        Route.gotoPage(sut.Index);
        TH.selectMenu('#Team [name=teamType_id]', TH.match.field('id', 'tt1'));

        TH.click('td', v.team.name);
      },

      "test change name": function () {
        assert.dom('#EditTeam', function () {
          assert.dom('h1', 'Edit ' + v.team.name);
          TH.input('[name=name]', {value: v.team.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Team td', 'new name');
      },

      "test delete": function () {
        assert.dom('#EditTeam', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.team.name + '?');
          TH.click('[name=cancel]');
        });

        refute.dom('.Dialog');

        assert(Team.exists(v.team._id));

        TH.click('#EditTeam [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditTeam');

        refute(Team.exists(v.team._id));
      },
    },

  });
});
