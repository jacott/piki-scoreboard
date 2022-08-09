define((require, exports, module) => {
  const session         = require('koru/session');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  const User = require('./user');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('isSuperUser', () => {
      var user = Factory.buildUser('su');

      assert.isFalse(user.isSuperUser());
      user.attributes.role = 's';

      assert.isTrue(user.isSuperUser());

      user.attributes.role = 'x';
      assert.isFalse(user.isSuperUser());
    });

    test('isAdmin', () => {
      var adminUser = Factory.createUser({role: 'a'});
      var user = Factory.createUser({role: 'j'});
      var su = Factory.createUser('su');

      assert.isFalse(user.isAdmin());
      user.role = 'a';
      assert.isFalse(user.isAdmin());

      assert.isTrue(adminUser.isAdmin());
      assert.isTrue(su.isAdmin());
    });

    test('canAdminister, canJudge', () => {
      var doc = new User({org_id: '123'});
      doc.attributes.role = User.ROLE.superUser;

      refute(doc.canAdminister());
      refute(doc.canAdminister('x'));

      doc.attributes.role = User.ROLE.admin;

      const event = {attributes: {org_id: doc.org_id}};

      refute(doc.canAdminister());
      assert(doc.canAdminister(event));
      assert(doc.canAdminister({attributes: {}, org_id: doc.org_id}));
      refute(doc.canAdminister({attributes: {org_id: '456'}, org_id: doc.org_id}));
      assert(doc.canJudge(event));

      doc.attributes.role = User.ROLE.judge;
      doc.changes.role = User.ROLE.superUser;

      assert.same(doc.safeRole, User.ROLE.judge);

      refute(doc.canAdminister(event));
      assert(doc.canJudge(event));

      doc.attributes.role = User.ROLE.climber;

      refute(doc.canJudge(event));
    });

    test('forgotPassword', () => {
      stub(session, 'rpc');
      const cb = stub();

      User.forgotPassword('email@address', cb);

      assert.calledWith(session.rpc, 'User.forgotPassword', 'email@address', cb);
    });
  });
});
