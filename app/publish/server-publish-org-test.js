define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./server-publish-org');
  var publish = require('koru/session/publish');
  var Model = require('koru/model');
  var env = require('koru/env');
  var User = require('models/user');
  var Org = require('models/org');

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


      var orgSpy = test.spy(User, 'observeOrg_id');


      // Subscribe
      var sub = TH.mockSubscribe(v, 'Org', 's123', 'foo');

      // Test initial data
      assert.calledWith(v.conn.added, 'User', user1._id, user1.attributes);
      assert.calledWith(v.conn.added, 'User', user2._id, user2.attributes);


      // Test changes
      user1.name = 'new name';
      user1.$$save();

      assert.calledWith(v.conn.changed, 'User', user1._id, {name: 'new name'});


      // *** test stopping ***
      assert.calledWith(orgSpy, org1._id);
      var orgStop = test.spy(orgSpy.returnValues[0], 'stop');

      sub.stop();

      assert.called(orgStop);
    },

    "test org not found": function () {
      var sub = TH.mockSubscribe(v, 'Org', 's123', 'bad');

      refute(sub);

      assert.calledWith(v.send, 'Ps123|404|Org not found');
    },
  });
});
