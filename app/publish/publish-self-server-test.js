define((require, exports, module)=>{
  const koru            = require('koru');
  const Model           = require('koru/model');
  const publish         = require('koru/session/publish');
  const Org             = require('models/org');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  const sut = require('./publish-self-server');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.cleanUpTest(v);
      v = {};
    });

    test("publish guest", ()=>{
      const sub = TH.mockSubscribe(v, 's123', 'Self');

      assert.same(v.conn.userId, 'guest');

      assert(sub._stop);
    });

    test("publish user", ()=>{
      const org1 = Factory.createOrg();
      const user = Factory.createUser();
      const org2 = Factory.createOrg();

      TH.loginAs(user);

      spy(User, 'observeId');
      spy(Org, 'onChange');

      // Subscribe
      const sub = TH.mockSubscribe(v, 's123', 'Self');

      assert.msg("should be logged in user")
        .same(v.conn.userId, user._id);


      // Test initial data
      assert.calledWith(v.conn.added, 'User', user._id, user.attributes);
      assert.calledWith(v.conn.added, 'Org', org1._id, org1.attributes, undefined);
      assert.calledWith(v.conn.added, 'Org', org2._id, org2.attributes, {email: true});


      // Test changes
      user.name = 'new name';
      user.$$save();

      assert.calledWith(v.conn.changed, 'User', user._id, {name: 'new name'});

      org1.$remove();
      assert.calledWith(v.conn.removed, 'Org', org1._id);


      // *** test stopping ***
      assert.calledWith(User.observeId, user._id);
      const uStop = spy(User.observeId.firstCall.returnValue, 'stop');

      assert.calledOnce(Org.onChange);
      const oStop = spy(Org.onChange.firstCall.returnValue, 'stop');

      sub.stop();

      assert.called(uStop);
      assert.called(oStop);
    });

    test("user not found", ()=>{
      stub(koru, 'userId').returns('bad');

      const sub = TH.mockSubscribe(v, 's123', 'Self');

      refute(sub);

      assert.calledWith(v.conn.sendBinary, 'P', ['s123', 404, 'User not found']);
    });
  });
});
