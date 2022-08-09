isServer && define((require, exports, module) => {
  const TH              = require('koru/model/test-db-helper');
  const ConnTH          = require('koru/session/conn-th-server');
  const UserAccount     = require('koru/user-account');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, util, match: m} = TH;

  const OrgPub = require('pubsub/org-pub');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let conn;
    beforeEach(async () => {
      await TH.startTransaction();
      conn = ConnTH.mockConnection();
    });

    afterEach(async () => {
      ConnTH.stopAllSubs(conn);
      util.thread.userId = undefined;
      OrgPub.shutdown();
      await TH.rollbackTransaction();
    });

    test('publish guest', async () => {
      await conn.setUserId('guest');
      const org0 = await Factory.createOrg();
      const climber0 = await Factory.createClimber();
      const org1 = await Factory.createOrg();

      const climber = await Factory.createClimber({dateOfBirth: '1979-01-01'});

      const sub = await conn.onSubscribe('sub1', 1, 'Org', org1._id);

      assert.calledOnce(conn.sendEncoded);
      assert.encodedCall(conn, 'A', ['Climber', filterDateOfBirth(climber.attributes)]);
      refute.encodedCall(conn, 'A', ['Climber', m.field('_id', climber0._id)]);
      conn.sendEncoded.reset();

      await climber0.$update('name', 'not me');
      refute.called(conn.sendEncoded);

      await climber.$update({name: 'new name', dateOfBirth: '1970-04-23'});
      assert.encodedCall(conn, 'C', ['Climber', climber._id, {name: 'new name'}]);

      const cl2 = await Factory.createClimber();

      assert.encodedCall(conn, 'A', ['Climber', m((attrs) => {
        assert.same(attrs.name, cl2.name);
        assert.same(attrs.dateOfBirth, undefined);

        return true;
      })]);
    });

    test('publish admin', async () => {
      stub(UserAccount, 'sendResetPasswordEmail');
      const org0 = await Factory.createOrg();
      const admin = await Factory.createUser();
      const climber0 = await Factory.createClimber();
      const user = await Factory.createUser();

      const org1 = await Factory.createOrg();

      const climber = await Factory.createClimber();

      await conn.setUserId(admin._id);

      const sub = await conn.onSubscribe('sub1', 1, 'Org', org0._id);

      assert.calledOnce(conn.sendEncoded);
      refute.encodedCall(conn, 'A', ['Climber', climber.attributes]);
      assert.encodedCall(conn, 'A', ['Climber', climber0.attributes]);
      assert.encodedCall(conn, 'A', ['User', Object.assign({
        role: 'a', org_id: org0._id}, user.attributes)]);

      conn.sendEncoded.reset();

      await climber.$update('name', 'not me');
      refute.called(conn.sendEncoded);

      await climber0.$update('name', 'new name');
      assert.encodedCall(conn, 'C', ['Climber', climber0._id, {name: 'new name'}]);

      await user.$update('name', 'new user name');
      assert.encodedCall(conn, 'C', ['User', user._id, {name: 'new user name'}]);

      conn.sendEncoded.reset();
      const user2 = await Factory.createUser();
      refute.called(conn.sendEncoded);

      const role = await Factory.createRole({org_id: org0._id, user_id: user2._id});

      assert.encodedCall(conn, 'A', ['User', Object.assign({
        role: 'a', org_id: org0._id}, user2.attributes)]);

      await role.$update('role', 'j');

      assert.encodedCall(conn, 'C', ['User', user2._id, {role: 'j'}]);

      await role.$remove();

      assert.encodedCall(conn, 'R', ['User', user2._id, undefined]);
    });

    test('userIdChanged', async () => {
      stub(UserAccount, 'sendResetPasswordEmail');
      await conn.setUserId('guest');
      const org0 = await Factory.createOrg();
      const climber0 = await Factory.createClimber();
      const org1 = await Factory.createOrg();
      const admin = await Factory.createUser();

      const climber = await Factory.createClimber({dateOfBirth: '1979-01-01'});

      const sub = await conn.onSubscribe('sub1', 1, 'Org', org1._id);
      conn.sendEncoded.reset();

      await sub.userIdChanged(admin._id, 'guest');

      assert.encodedCall(conn, 'A', ['Climber', climber.attributes]);

      conn.sendEncoded.reset();
      await sub.userIdChanged('guest', admin._id);

      assert.encodedCall(conn, 'A', [
        'Climber', filterDateOfBirth(climber.attributes)]);
    });
  });

  const filterDateOfBirth = (attrs) => util.mergeExclude({}, attrs, {dateOfBirth: true});
});
