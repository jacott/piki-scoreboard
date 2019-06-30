isServer && define((require, exports, module)=>{
  const ConnTH          = require('koru/session/conn-th-server');
  const User            = require('models/user');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, util} = TH;

  const SelfPub = require('./self-pub');

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    let conn;

    beforeEach(()=>{
      conn = ConnTH.mockConnection('s123');
      User.guestUser();
    });

    afterEach(()=>{
      ConnTH.stopAllSubs(conn);
      util.thread.userId = void 0;
      TH.clearDB();
    });

    test("publish guest", ()=>{
      const org1 = Factory.createOrg();
      const org2 = Factory.createOrg();
      const user = Factory.createUser();
      const sub = conn.onSubscribe("sub1", 1, "Self");

      assert.same(sub.conn.userId, "guest");
      assert.encodedCall(sub.conn, 'A', [
        'Org', {_id: org1._id, name: 'Org 1', shortName: 'SN1'}]);
      assert.encodedCall(sub.conn, 'A', [
        'Org', {_id: org2._id, name: 'Org 2', shortName: 'SN2'}]);
      assert.calledOnce(sub.conn.sendEncoded);
      refute.called(sub.conn.added);
    });

    test("publish user", ()=>{
      const org1 = Factory.createOrg();
      const user = Factory.createUser();

      conn.userId = user._id;

      spy(User, 'observeId');

      // Subscribe
      const sub = conn.onSubscribe('sub1', 1, 'Self');
      onEnd(() => sub && sub.stop());

      // Test initial data
      assert.calledOnceWith(sub.conn.added, 'User', user.attributes);

      // Test changes
      user.name = 'new name';
      user.$$save();

      assert.calledWith(sub.conn.sendBinary, 'C', ['User', user._id, {name: 'new name'}]);


      // *** test stopping ***
      assert.calledWith(User.observeId, user._id);
      const uStop = spy(User.observeId.firstCall.returnValue, 'stop');

      sub.stop();

      assert.called(uStop);
    });

    test("user not found", ()=>{
      conn.userId = 'bad';

      const sub = conn.onSubscribe('s123', 1, 'Self');

      refute(sub);

      assert.calledWith(conn.sendBinary, 'Q', ['s123', 1, 404, 'User not found']);
    });
  });
});
