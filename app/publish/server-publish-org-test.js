define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./publish-org');
  var publish = require('koru/session/publish');
  var Model = require('koru/model');
  var env = require('koru/env');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.user = TH.Factory.createUser();
      TH.loginAs(v.user);
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test publish": function () {
      var org1 = TH.Factory.createOrg({shortName: 'foo'});

      var user1 = TH.Factory.createUser();
      var user2 = TH.Factory.createUser();

      var club1 = TH.Factory.createClub();

      var ObSpys = 'User Club Climber Event Category'.split(' ').map(function (name) {
        try {
          return test.spy(Model[name], 'observeOrg_id');
        } catch(ex) {
          ex.message += ". Failed for: " + name;
          throw ex;
        }
      });

      // Subscribe
      var sub = TH.mockSubscribe(v, 'Org', 's123', 'foo');

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
      var stopSpys = ObSpys.map(function (spy) {
        assert.calledWith(spy, org1._id);
        return  test.spy(spy.returnValues[0], 'stop');
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
    "//test session user not sent": function () {
    },



    "test org not found": function () {
      var sub = TH.mockSubscribe(v, 'Org', 's123', 'bad');

      refute(sub);

      assert.calledWith(v.send, 'Ps123|404|Org not found');
    },
  });
});