isClient && define(function (require, exports, module) {
  const session    = require('koru/session');
  const Route      = require('koru/ui/route');
  const Climber    = require('models/climber');
  const App        = require('ui/app');
  const TeamHelper = require('ui/team-helper');
  const sut        = require('./climber');
  const TH         = require('./test-helper');

  const {stub, spy, onEnd, util} = TH;

  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      App.setAccess();
    },

    tearDown() {
      TH.tearDown();
      TeamHelper.teamType_id = null;
      v = null;
    },

    "test rendering"() {
      const tt1 = TH.Factory.createTeamType();
      const team = TH.Factory.createTeam();
      var climber1 = TH.Factory.createClimber({team_ids: [team._id]});
      var climber2 = TH.Factory.createClimber();

      Route.gotoPage(sut.Index);

      assert.dom('#Climber', function () {;
        assert.dom('.climbers', function () {
          assert.dom('h1', 'Climbers');

          assert.dom('[name=selectTeamType]', '');
          TH.selectMenu('[name=selectTeamType]', TH.match.field('_id', tt1._id));

          assert.dom('table', function () {
            assert.dom('th[data-sort=team]', tt1.name);
            assert.dom('tr>td', climber1.name, function () {
              assert.domParent('td', climber1.shortName);
              assert.domParent('td', team.shortName);
            });
            assert.dom('tr>td', climber2.name, function () {
              assert.domParent('td', climber2.shortName);
            });
          });
        });
        assert.dom('nav [name=addClimber]', 'Add new climber');
      });
    },

    "test clearAllNumbers"() {
      stub(session, 'rpc');
      Route.gotoPage(sut.Index);

      TH.click('[name=clearAllNumbers]');

      TH.confirmRemove(()=> {
        assert.dom('h1', 'Clear all climber numbers?');
      });

      assert.calledWith(session.rpc, 'Climber.clearAllNumbers', v.org._id, TH.match(f => v.cb = f));

      assert.dom('#Flash .notice:not(.transient)', 'Clearing all climber numbers...');

      v.cb();

      refute.dom('#Flash .notice:not(.transient)');
      assert.dom('#Flash .notice.transient', 'Climber numbers cleared');
    },

    "test adding new climber"() {
      var team = TH.Factory.createTeam();

      Route.gotoPage(sut.Index);
      stub(Route.history, 'back');

      assert.dom('#Climber', function () {
        TH.click('[name=addClimber]');
        assert.dom('#AddClimber', function () {
          TH.input('[name=name]', 'Magnus Midtbø');
          TH.input('[name=dateOfBirth]', '1988-09-18');

          TH.input('[name=number]', '123');

          TH.selectMenu('[name=gender].select.on', 'm');
          TH.click('[type=submit]');
        });
        assert.called(Route.history.back);
      });

      var climber = Climber.query.where({org_id: v.org._id, name: 'Magnus Midtbø', dateOfBirth: '1988-09-18', number: 123}).fetchOne();

      assert(climber);

      assert.same(climber.gender, "m");
    },

    "edit": {
      setUp() {
        v.climber = TH.Factory.createClimber();
        v.climber2 = TH.Factory.createClimber();

        Route.gotoPage(sut.Index);

        TH.click('td', v.climber.name);
      },

      "test merge other climbers"() {
        stub(session, 'rpc');
        v.climber3 = TH.Factory.createClimber({name: 'Angela Eiter'});
        v.climber4 = TH.Factory.createClimber({name: 'Anne-Sophie Koller'});
        TH.click('[name=merge]');
        assert.dom('#MergeClimbers', function () {
          assert.dom('h1', "Select climbers to merge into " + v.climber.name);
          assert.dom('.list tbody', function () {
            assert.dom('tr', {count: 3});
            assert.dom('td.name', {text: v.climber2.name, parent() {
              refute.className(this, 'selected');
              assert.dom('td.select>[name=select]');
              TH.click(this);
              assert.className(this, 'selected');
            }});
            assert.dom('td.name', {text: v.climber3.name});
          });
          TH.input('[name=filter]', 'An');
          assert.dom('tr', {count: 3});
          TH.input('[name=filter]', 'Ang');
          assert.dom('tr', {count: 2});
          TH.click('.name', /Ang/);
          refute.called(session.rpc);
          TH.click('[type=submit]');
        });
        assert.dom('.Confirm', function () {
          assert.dom('h1', 'Merge climbers?');
          TH.click('button', 'Merge');
        });
        assert.dom('#MergeClimbers.merging');
        refute.dom('.Confirm');
        assert.calledWith(
          session.rpc, "Climber.merge", v.climber._id,
          TH.match(a => assert.equals(
            a.slice(0).sort(),
            [v.climber2._id, v.climber3._id].sort()
          ) || true)
        );
        stub(Route.history, 'back');
        session.rpc.yield();
        assert.dom('#Flash', "Climbers merged");
        assert.called(Route.history.back);
      },

      "test change name"() {
        stub(Route.history, 'back');

        assert.dom(document.body, function () {
        assert.dom('#EditClimber', function () {
          assert.dom('h1', 'Edit ' + v.climber.name);
          TH.input('[name=name]', {value: v.climber.name}, 'new name');
          TH.click('[type=submit]');
        });
        });

        assert.called(Route.history.back);
      },

      "test delete"() {
        assert.dom('#EditClimber', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.climber.name + '?');
          TH.click('[name=cancel]');
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
