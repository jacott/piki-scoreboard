define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./publish-org');
  var publish = require('koru/session/publish');
  var Model = require('koru/model');
  var koru = require('koru');
  var Val = require('koru/model/validation');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.user = TH.Factory.createUser();
      TH.loginAs(v.user);
      test.stub(Val, 'ensureString');
    },

    tearDown: function () {
      TH.cleanUpTest(v);
      v = null;
    },

    "test publish": function () {
      var org1 = TH.Factory.createOrg({shortName: 'foo'});

      var user1 = TH.Factory.createUser();
      var user2 = TH.Factory.createUser();

      var club1 = TH.Factory.createClub();

      var obSpys = 'User Club Climber Event Category'.split(' ').map(function (name) {
        try {
          return test.spy(Model[name], 'observeOrg_id');
        } catch(ex) {
          ex.message += ". Failed for: " + name;
          throw ex;
        }
      });

      // Subscribe
      var sub = TH.mockSubscribe(v, 's123', 'Org', 'foo');

      assert.calledWith(Val.ensureString, 'foo');

      // Test initial data
      assert.calledWith(v.conn.added, 'User', user1._id, user1.attributes);
      assert.calledWith(v.conn.added, 'User', user2._id, user2.attributes);


      assert.calledWith(v.conn.added, 'Club', club1._id, club1.attributes);


      // Test changes
      user1.name = 'new name';
      user1.$$save();

      assert.calledWith(v.conn.changed, 'User', user1._id, {name: 'new name'});


      club1.name = 'new club name';
      club1.$$save();

      assert.calledWith(v.conn.changed, 'Club', club1._id, {name: 'new club name'});

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
    "test session user not sent": function () {
      var org = v.user.org;

      var sub = TH.mockSubscribe(v, 's123', 'Org', org.shortName);

      refute.calledWith(v.conn.added, 'User');

      v.user.name = 'new name';
      v.user.$$save();

      refute.calledWith(v.conn.changed, 'User');
    },

    "test org not found": function () {
      var sub = TH.mockSubscribe(v, 's123', 'Org', 'bad');

      refute(sub);

      assert.calledWith(v.conn.sendBinary, 'P', ['s123', 404, 'Org not found']);
    },
  });
});
