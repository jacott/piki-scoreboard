define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./server-publish-self');
  var publish = require('koru/session/publish');
  var Model = require('koru/model');
  var env = require('koru/env');
  var User = require('models/user');
  var Org = require('models/org');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test publish guest": function () {
      var sub = TH.mockSubscribe(v, 'Self', 's123');

      assert.same(v.conn.userId, 'guest');

      refute(sub._stop);
    },

    "test publish user": function () {
      var user = TH.Factory.createUser();
      var org1 = TH.Factory.createOrg();
      var org2 = TH.Factory.createOrg();

      TH.loginAs(user);

      test.spy(User, 'observeId');
      test.spy(Org, 'onChange');


      // Subscribe
      var sub = TH.mockSubscribe(v, 'Self', 's123');

      assert.msg("should be logged in user")
        .same(v.conn.userId, user._id);


      // Test initial data
      assert.calledWith(v.conn.added, 'User', user._id, user.attributes);
      assert.calledWith(v.conn.added, 'Org', org1._id, org1.attributes);
      assert.calledWith(v.conn.added, 'Org', org2._id, org2.attributes);


      // Test changes
      user.name = 'new name';
      user.$$save();

      assert.calledWith(v.conn.changed, 'User', user._id, {name: 'new name'});

      org1.$remove();
      assert.calledWith(v.conn.removed, 'Org', org1._id);


      // *** test stopping ***
      assert.calledWith(User.observeId, user._id);
      var uStop = test.spy(User.observeId.returnValues[0], 'stop');

      assert.calledOnce(Org.onChange);
      var oStop = test.spy(Org.onChange.returnValues[0], 'stop');

      sub.stop();

      assert.called(uStop);
      assert.called(oStop);
    },

    "test user not found": function () {
      test.stub(env, 'userId').returns('bad');

      var sub = TH.mockSubscribe(v, 'Self', 's123');

      refute(sub);

      assert.calledWith(v.send, 'Ps123|404|User Not Found');
    },
  });
});
