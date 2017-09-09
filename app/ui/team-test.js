isClient && define(function (require, exports, module) {
  var test, v;
  const Route      = require('koru/ui/route');
  const Team       = require('models/team');
  const TeamType   = require('models/team-type');
  const App        = require('ui/app');
  const TeamHelper = require('ui/team-helper');
  const sut        = require('./team');
  const TH         = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      TH.Factory.createTeamType({_id: 'tt1', name: 'type 1'});
      App.setAccess();
    },

    tearDown() {
      TH.tearDown();
      v = null;
      TeamHelper.teamType_id = null;
    },

    "test rendering"() {
      var teams = TH.Factory.createList(2, 'createTeam');
      TH.Factory.createTeamType();
      var other = TH.Factory.createTeam();

      TeamHelper.teamType_id = 'foo'; // should self correct

      Route.gotoPage(sut.Index);

      assert.dom('#Team', function () {
        assert.dom('#TeamIndex.noTeamType');

        TH.selectMenu('[name=teamType_id]', 'tt1');
        assert.dom('#TeamIndex:not(.noTeamType)');
        assert.dom('[name=teamType_id]', 'type 1');

        assert.dom('.teams', function () {
          assert.dom('table', function () {
            assert.dom('tr', {count: 3});
            assert.dom('tr>td', teams[0].name, function () {
              assert.domParent('td', teams[0].shortName);
            });
            assert.dom('tr>td', teams[1].name, function () {
              assert.domParent('td', teams[1].shortName);
            });
          });
        });
        assert.dom('nav [name=addTeam]', 'Add new type 1');
      });
    },

    "test adding new team"() {
      Route.gotoPage(sut.Index);

      TH.selectMenu('#Team [name=teamType_id]', 'tt1');
      assert.dom('#Team', function () {
        TH.click('[name=addTeam]');
      });
      assert.dom('body', function () {
        assert.dom('.Dialog #AddTeam', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'Wgtn');
          TH.click('[type=submit]');
        });
        refute.dom('#AddTeam');
      });

      assert(Team.exists({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'Wgtn', teamType_id: 'tt1'}));

      assert.dom('#Team [name=addTeam]');
    },

    "test non admin can't add teamType "() {
      TH.user().attributes.role = 'j';
      Route.gotoPage(sut.Index);

      TH.selectMenu('#Team [name=teamType_id]', 'tt1', function () {
        assert.dom(this.parentNode, function () {
          assert.dom('li', {count: 1});
        });
      });
    },

    "test adding new teamType"() {
      Route.gotoPage(sut.Index);

      TH.selectMenu('#Team [name=teamType_id]', '$new');

      assert.dom('#AddTeamType', function () {
        TH.input('[name=name]', 'Club');
        TH.click(':not(.checked)>[name=default]');
        assert.dom('.checked>[name=default]');
        TH.click('[type=submit]');
      });
      refute.dom('#AddTeamType');

      assert(TeamType.exists({org_id: v.org._id, name: 'Club', default: true}));

      TH.selectMenu('#Team [name=teamType_id]', '$new');

      assert.dom('#AddTeamType', function () {
        TH.input('[name=name]', 'School');
        TH.click('[type=submit]');
      });
      refute.dom('#AddTeamType');

      assert(TeamType.exists({org_id: v.org._id, name: 'School', default: false}));

      TH.selectMenu('#Team [name=teamType_id]', '$new');
      assert.dom('#AddTeamType', function () {
        TH.click('[name=cancel]');
      });
      refute.dom('#AddTeamType');
    },

    "test edit teamType"() {
      let tt = TH.Factory.createTeamType({default: true});
      Route.gotoPage(sut.Index);
      TH.selectMenu('#Team [name=teamType_id]', tt._id);

      TH.click('[name=EditTeamType]');

      assert.dom('#EditTeamType', function () {
        assert.dom('h1', 'Edit ' + tt.name);
        TH.click('[name=cancel]');
      });
      refute.dom('#EditTeamType');

      TH.click('[name=EditTeamType]');

      assert.dom('#EditTeamType', function () {
        assert.dom('h1', 'Edit ' + tt.name);
        TH.input('[name=name]', {value: tt.name}, 'new name');
        TH.click('label.checked>[name=default]');
        TH.click('[type=submit]');
      });
      refute.dom('#EditTeamType');

      assert(TeamType.exists({org_id: tt.org_id, name: 'new name', default: false}));
    },

    "edit": {
      setUp() {
        v.team = TH.Factory.createTeam();
        v.team2 = TH.Factory.createTeam();

        Route.gotoPage(sut.Index);
        TH.selectMenu('#Team [name=teamType_id]', 'tt1');

        TH.click('td', v.team.name);
      },

      "test change name"() {
        assert.dom('#Edit', function () {
          assert.dom('h1', 'Edit ' + v.team.name);
          TH.input('[name=name]', {value: v.team.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Team td', 'new name');
      },

      "test delete"() {
        assert.dom('#Edit', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.team.name + '?');
          TH.click('[name=cancel]');
        });

        refute.dom('.Dialog');

        assert(Team.exists(v.team._id));

        TH.click('#Edit [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#Edit');

        refute(Team.exists(v.team._id));
      },
    },

  });
});
