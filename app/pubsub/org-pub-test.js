isServer && define((require, exports, module)=>{
  const TH              = require('koru/model/test-db-helper');
  const ConnTH          = require('koru/session/conn-th-server');
  const UserAccount     = require('koru/user-account');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, util, match: m} = TH;

  const OrgPub = require('pubsub/org-pub');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let conn;
    beforeEach(()=>{
      TH.startTransaction();
      conn = ConnTH.mockConnection();
    });

    afterEach(()=>{
      ConnTH.stopAllSubs(conn);
      util.thread.userId = void 0;
      TH.rollbackTransaction();
      OrgPub.shutdown();
    });

    test("publish guest", ()=>{
      conn.userId = 'guest';
      const org0 = Factory.createOrg();
      const climber0 = Factory.createClimber();
      const org1 = Factory.createOrg();

      const climber = Factory.createClimber({dateOfBirth: '1979-01-01'});

      const sub = conn.onSubscribe('sub1', 1, "Org", org1._id);

      assert.calledOnce(conn.sendEncoded);
      assert.encodedCall(conn, 'A', ['Climber', filterDateOfBirth(climber.attributes)]);
      refute.encodedCall(conn, 'A', ['Climber', m.field('_id', climber0._id)]);
      conn.sendEncoded.reset();

      climber0.$update('name', 'not me');
      refute.called(conn.sendEncoded);

      climber.$update({name: 'new name', dateOfBirth: '1970-04-23'});
      assert.encodedCall(conn, 'C', ['Climber', climber._id, {name: 'new name'}]);

      const cl2 = Factory.createClimber();

      assert.encodedCall(conn, 'A', ['Climber', m(attrs =>{
        assert.same(attrs.name, cl2.name);
        assert.same(attrs.dateOfBirth, void 0);

        return true;
      })]);
    });

    test("publish admin", ()=>{
      stub(UserAccount, 'sendResetPasswordEmail');
      const org0 = Factory.createOrg();
      const admin = Factory.createUser();
      const climber0 = Factory.createClimber();
      const user = Factory.createUser();

      const org1 = Factory.createOrg();

      const climber = Factory.createClimber();


      conn.userId = admin._id;

      const sub = conn.onSubscribe('sub1', 1, "Org", org0._id);

      assert.calledOnce(conn.sendEncoded);
      refute.encodedCall(conn, 'A', ['Climber', climber.attributes]);
      assert.encodedCall(conn, 'A', ['Climber', climber0.attributes]);
      assert.encodedCall(conn, 'A', ['User', Object.assign({
        role: 'a', org_id: org0._id,}, user.attributes)]);

      conn.sendEncoded.reset();

      climber.$update('name', 'not me');
      refute.called(conn.sendEncoded);

      climber0.$update('name', 'new name');
      assert.encodedCall(conn, 'C', ['Climber', climber0._id, {name: 'new name'}]);

      user.$update('name', 'new user name');
      assert.encodedCall(conn, 'C', ['User', user._id, {name: 'new user name'}]);

      conn.sendEncoded.reset();
      const user2 = Factory.createUser();
      refute.called(conn.sendEncoded);

      const role = Factory.createRole({org_id: org0._id, user_id: user2._id});

      assert.encodedCall(conn, 'A', ['User', Object.assign({
        role: 'a', org_id: org0._id,}, user2.attributes)]);

      role.$update('role', 'j');

      assert.encodedCall(conn, 'C', ['User', user2._id, {role: 'j'}]);

      role.$remove();

      assert.encodedCall(conn, 'R', ['User', user2._id, void 0]);
    });

    test("userIdChanged", ()=>{
      conn.userId = 'guest';
      const org0 = Factory.createOrg();
      const climber0 = Factory.createClimber();
      const org1 = Factory.createOrg();
      const admin = Factory.createUser();

      const climber = Factory.createClimber({dateOfBirth: '1979-01-01'});

      const sub = conn.onSubscribe('sub1', 1, "Org", org1._id);
      conn.sendEncoded.reset();

      sub.userIdChanged(admin._id, 'guest');

      assert.encodedCall(conn, 'A', ['Climber', climber.attributes]);

      conn.sendEncoded.reset();
      sub.userIdChanged('guest', admin._id);


      assert.encodedCall(conn, 'A', [
        'Climber', filterDateOfBirth(climber.attributes)]);

    });
  });

  const filterDateOfBirth = (attrs)=> util.mergeExclude({}, attrs, {dateOfBirth: true});
});
