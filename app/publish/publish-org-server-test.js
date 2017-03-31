define(function (require, exports, module) {
  var test, v;
  const koru    = require('koru');
  const Model   = require('koru/model');
  const Val     = require('koru/model/validation');
  const publish = require('koru/session/publish');
  const sut     = require('./publish-org');
  const TH      = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.user = TH.Factory.createUser();
      TH.loginAs(v.user);
      test.stub(Val, 'ensureString');
    },

    tearDown() {
      TH.cleanUpTest(v);
      v = null;
    },

    "test publish"() {
      var org1 = TH.Factory.createOrg({shortName: 'foo'});

      var user1 = TH.Factory.createUser();
      var user2 = TH.Factory.createUser();

      var tt1 = TH.Factory.createTeamType();
      var team1 = TH.Factory.createTeam();

      var obSpys = 'User Climber Event Series Category Team TeamType'.split(' ').map(function (name) {
        try {
          return test.spy(Model[name], 'observeOrg_id');
        } catch(ex) {
          ex.message += ". Failed for: " + name;
          throw ex;
        }
      });

      // Subscribe
      var sub = TH.mockSubscribe(v, 's123', 'Org', 'foo');

      assert.equals(sub.conn.org_id, org1._id);


      assert.calledWith(Val.ensureString, 'foo');

      // Test initial data
      assert.calledWith(v.conn.added, 'User', user1._id, user1.attributes);
      assert.calledWith(v.conn.added, 'User', user2._id, user2.attributes);


      assert.calledWith(v.conn.added, 'Team', team1._id, team1.attributes);
      assert.calledWith(v.conn.added, 'TeamType', tt1._id, tt1.attributes);


      // Test changes
      user1.name = 'new name';
      user1.$$save();

      assert.calledWith(v.conn.changed, 'User', user1._id, {name: 'new name'});


      team1.name = 'new team name';
      team1.$$save();

      assert.calledWith(v.conn.changed, 'Team', team1._id, {name: 'new team name'});

      // *** test stopping ***
      var stopSpys = obSpys.map(function (spy) {
        assert.calledWith(spy, org1._id);
        return test.spy(spy.firstCall.returnValue, 'stop');
      });

      sub.stop();

      stopSpys.forEach(function (spy) {
        assert.called(spy);
      });
    },

    /**
     * session user should not be sent to client as it is already
     * present.
     */
    "test session user not sent"() {
      var org = v.user.org;

      var sub = TH.mockSubscribe(v, 's123', 'Org', org.shortName);

      refute.calledWith(v.conn.added, 'User');

      v.user.name = 'new name';
      v.user.$$save();

      refute.calledWith(v.conn.changed, 'User');
    },

    "test org not found"() {
      var sub = TH.mockSubscribe(v, 's123', 'Org', 'bad');

      refute(sub);

      assert.calledWith(v.conn.sendBinary, 'P', ['s123', 404, 'Org not found']);
    },
  });
});
