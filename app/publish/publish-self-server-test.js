define(function (require, exports, module) {
  const koru    = require('koru');
  const Model   = require('koru/model');
  const publish = require('koru/session/publish');
  const Org     = require('models/org');
  const User    = require('models/user');
  const TH      = require('./test-helper');

  const sut     = require('./publish-self');
  var test, v;

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.cleanUpTest(v);
      v = null;
    },

    "test publish guest"() {
      var sub = TH.mockSubscribe(v, 's123', 'Self');

      assert.same(v.conn.userId, 'guest');

      assert(sub._stop);
    },

    "test publish user"() {
      var user = TH.Factory.createUser();
      var org1 = TH.Factory.createOrg();
      var org2 = TH.Factory.createOrg();

      TH.loginAs(user);

      test.spy(User, 'observeId');
      test.spy(Org, 'onChange');

      // Subscribe
      var sub = TH.mockSubscribe(v, 's123', 'Self');

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
      var uStop = test.spy(User.observeId.firstCall.returnValue, 'stop');

      assert.calledOnce(Org.onChange);
      var oStop = test.spy(Org.onChange.firstCall.returnValue, 'stop');

      sub.stop();

      assert.called(uStop);
      assert.called(oStop);
    },

    "test user not found"() {
      test.stub(koru, 'userId').returns('bad');

      var sub = TH.mockSubscribe(v, 's123', 'Self');

      refute(sub);

      assert.calledWith(v.conn.sendBinary, 'P', ['s123', 404, 'User not found']);
    },
  });
});
