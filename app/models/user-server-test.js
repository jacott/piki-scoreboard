define((require, exports, module) => {
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const UserAccount     = require('koru/user-account');
  const util            = require('koru/util');
  const ChangeLog       = require('models/change-log');
  const Role            = require('models/role');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, intercept} = TH;

  const User = require('./user');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(async () => {
      await TH.rollbackTransaction();
      v = {};
    });

    group('observeOrg_id', () => {
      let dc;
      beforeEach(async () => {
        v.org = await Factory.createOrg();
        const cb = (v) => {dc = v.clone()};
        onEnd(User.observeOrg_id([v.org._id], cb));
        v.user = await User.create({
          email: 'foo@bar.com', name: 'foo', initials: 'F'});
      });

      afterEach(() => {
        dc = undefined;
      });

      test('role', async () => {
        const org_id = v.org._id;
        const {user} = v;
        assert.same(dc, undefined);

        const role = await Role.create({user_id: user._id, org_id, role: 'a'});

        assert.equals(dc.doc.attributes, {
          org_id, role: 'a',
          email: user.email, name: user.name, initials: user.initials,
          _id: user._id,
        });
        assert.equals(v.undo, null);

        await role.$update('role', 'j');

        assert.equals(dc.doc.attributes.role, 'j');
        assert.equals(dc.undo, {role: 'a'});

        await role.$remove();
        assert(dc.isDelete);
        assert.equals(dc.doc.attributes, {
          org_id, role: 'j',
          email: user.email, name: user.name, initials: user.initials,
          _id: user._id,
        });
      });

      test('user field', async () => {
        const {user} = v;
        const org1 = v.org;
        const org2 = await Factory.createOrg();
        let dc2;
        const cb2 = (dc) => {dc2 = dc.clone()};
        onEnd(User.observeOrg_id([org2._id], cb2));

        const role1 = await Role.create({user_id: user._id, org_id: org1._id, role: 'j'});
        const role2 = await Role.create({user_id: user._id, org_id: org2._id, role: 'a'});

        await user.$update('name', 'new name');

        assert.equals(dc.doc.name, 'new name');
        assert.equals(dc.doc.attributes.org_id, org1._id);
        assert.equals(dc2.doc.name, 'new name');
        assert.equals(dc2.doc.attributes.org_id, org2._id);
      });
    });

    test('guestUser', async () => {
      const guest = await User.guestUser();
      assert.equals(guest._id, 'guest');

      assert.equals(guest.attributes, (await User.guestUser()).attributes);
    });

    test('canAdminister', async () => {
      const org_id = (await Factory.createOrg())._id;
      const doc = await Factory.createUser({org_id: undefined, role: 's'});
      const role = await Role.query.fetchOne();

      refute(await doc.canAdminister());
      refute(await doc.canAdminister('x'));

      await role.$update({org_id, role: User.ROLE.admin});
      util.thread.connection = {org_id};

      refute(await doc.canAdminister());
      assert(await doc.canAdminister({attributes: {org_id}}));
      assert(await doc.canAdminister({attributes: {}, org_id}));
      refute(await doc.canAdminister({attributes: {org_id: '456'}, org_id}));

      await role.$update({role: User.ROLE.judge});

      refute(await doc.canAdminister());
    });

    group('authorize', () => {
      test('accessDenied', async () => {
        TH.noInfo();
        const org = await Factory.createOrg();
        const subject = await Factory.createUser({_id: 'subjUser'});
        subject.changes = {org_id: org._id};
        { /** super user okay **/
          const user = await Factory.createUser('su', {_id: 'suUser'});
          await refute.accessDenied(() => subject.authorize(user._id));
        }

        { /** admin user not okay if more than one role **/
          const user = await Factory.createUser('admin', {_id: 'adminUser'});
          subject.changes = {role: 'j', name: 'foo', org_id: org._id};
          await refute.accessDenied(() => subject.authorize(user._id)); // one okay


          await Factory.createRole({user_id: subject._id, org_id: 'org2', role: 'j'});
          await assert.accessDenied(() => subject.authorize(user._id)); // two not okay

          delete subject.changes.name;
          await refute.accessDenied(() => subject.authorize(user._id)); // unless change just role

          subject.changes.name = 'foo';
          await Role.db.query(`delete from "Role" where user_id = '${subject._id}'`);
          await refute.accessDenied(() => subject.authorize(user._id)); // none okay
        }

        { /** judge not okay **/
          const user = await Factory.createUser({role: 'j'});
          subject.changes = {role: 'j', name: 'foo'};
          await assert.accessDenied(() => subject.authorize(user._id));
          subject.changes = {role: 'j'};
          await assert.accessDenied(() => subject.authorize(user._id));
        }
      });

      test('org_is not in changes', async () => {
        const org = await Factory.createOrg();
        const subject = await Factory.createUser({_id: 'subjUser'});
        const admin = await Factory.createUser('admin', {_id: 'adminUser'});
        const user = await Factory.createUser('su', {_id: 'suUser'});
        user.changes = {name: 'new name'};
        TH.noInfo();
        await assert.exception(() => user.authorize(admin._id),
                               {error: 403});
      });

      test('new record same email', async () => {
        const org = await Factory.createOrg();
        const subject = await Factory.createUser({_id: 'subjUser'});
        const org2 = await Factory.createOrg();
        const admin = await Factory.createUser('admin', {_id: 'adminUser'});

        const sub2 = new User({});
        sub2.changes = {
          _id: 'sub2', org_id: org2._id,
          name: 'sub 2', initials: 'S2',
          email: '   ' + subject.email.toUpperCase() + '   ', role: 'c',
        };

        await sub2.authorize(admin._id);

        assert.equals(sub2.changes, {org_id: org2._id, role: 'c'});
        assert.equals(sub2.attributes, subject.attributes);
      });

      test('new record new email', async () => {
        const org = await Factory.createOrg();
        const subject = await Factory.createUser({_id: 'subjUser'});
        const org2 = await Factory.createOrg();
        const admin = await Factory.createUser('admin', {_id: 'adminUser'});

        const sub2 = new User({});
        sub2.changes = {
          _id: 'sub2', org_id: org2._id,
          name: 'sub 2', initials: 'S2',
          email: 'new' + subject.email, role: 'c',
        };

        await sub2.authorize(admin._id);

        assert.equals(sub2.changes, {
          _id: 'sub2', org_id: org2._id,
          name: 'sub 2', initials: 'S2',
          email: 'new' + subject.email, role: 'c',
        });
        assert.equals(sub2.attributes, {});
      });

      test('admin changing superuser', async () => {
        TH.noInfo();
        const org = await Factory.createOrg();
        const user = await Factory.createUser({_id: 'userId', org_id: org._id, role: User.ROLE.admin});
        const subject = await Factory.createUser('su', {_id: 'subjectId'});
        subject.changes = {org_id: org._id, role: 'a'};

        await assert.accessDenied(() => subject.authorize(user._id));
      });

      test('self change', async () => {
        const org = await Factory.createOrg();
        const subject = await Factory.createUser({_id: 'subjUser', role: 'c'});
        subject.changes = {org_id: org._id};
        await refute.accessDenied(() => subject.authorize(subject._id));
      });
    });

    test('make su', async () => {
      const org = await Factory.createOrg();
      const subject = await Factory.createUser({_id: 'subjUser', role: 'c'});
      const org2 = await Factory.createOrg();
      await Role.create({org_id: org2._id, user_id: subject._id, role: 'a'});

      subject.changes = {org_id: org._id, role: 's'};

      await subject.$$save();

      assert.equals(await Role.query.map((r) => [r.org_id, r.user_id, r.role]), [[
        undefined, 'subjUser', 's',
      ]]);
    });

    test('make not su', async () => {
      const org = await Factory.createOrg();
      const subject = await Factory.createUser('su', {_id: 'subjUser'});

      subject.changes = {org_id: org._id, role: 'c'};

      await subject.$$save();

      assert.equals(await Role.query.map((r) => [r.org_id, r.user_id, r.role]), [[
        org._id, 'subjUser', 'c',
      ]]);
    });

    test('role changes', async () => {
      const user = await Factory.createUser();
      const org2 = await Factory.createOrg();
      user.changes = {org_id: org2._id, role: 'c'};

      stub(UserAccount, 'sendResetPasswordEmail').returns(Promise.resolve());

      await user.$$save();

      assert(await Role.exists({org_id: org2._id, user_id: user._id, role: 'c'}));

      assert.calledWith(UserAccount.sendResetPasswordEmail, user);

      assert(await UserAccount.model.exists({userId: user._id, email: user.email}));

      user.changes = {org_id: org2._id, role: 'a'};

      await user.$$save();

      assert(await Role.exists({org_id: org2._id, user_id: user._id, role: 'a'}));
    });

    test('delete', async () => {
      const org2 = await Factory.createOrg();
      const user = await Factory.createUser();
      await UserAccount.createUserLogin({email: user.email, userId: user._id});
      user.changes = {org_id: org2._id, role: null};

      await user.$$save();

      refute(await Role.exists({org_id: org2._id, user_id: user._id}));
      refute(await UserAccount.model.exists({email: user.email}));

      /** make sure does not create is missing **/
      user.changes = {org_id: org2._id, role: null};

      await user.$$save();

      refute(await Role.exists({org_id: org2._id, user_id: user._id}));
    });

    test('createUser', async () => {
      let userP;
      stub(UserAccount, 'sendResetPasswordEmail', async (user, token) => {
        userP = User.exists({_id: user._id});
      });
      TH.loginAs(await Factory.createUser('su'));
      const user = await Factory.buildUser();
      await ChangeLog.docs.remove({});
      await user.$$save();

      const mUser = await UserAccount.model.findBy('userId', user._id);

      assert(mUser);

      assert.equals(mUser.email, user.email);

      assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));

      assert.isTrue(await userP);

      assert.same(await ChangeLog.query.count(), 1);
    });

    test('change email', async () => {
      const org = await Factory.createOrg();
      TH.loginAs(await Factory.createUser('su'));

      const rpc = TH.mockRpc(v);
      await rpc('save', 'User', TH.userId(), {email: 'foo@bar.com', org_id: org._id});

      const user = await User.findById(TH.userId());

      assert.same(user.email, 'foo@bar.com');

      const ul = await UserAccount.model.findBy('userId', user._id);

      assert.same(ul.email, user.email);
    });

    group('forgotPassword', () => {
      beforeEach(() => {
        stub(Val, 'ensureString');
        stub(UserAccount, 'sendResetPasswordEmail').returns(Promise.resolve());
        v.rpc = TH.mockRpc();
      });

      test('missing email', async () => {
        const res = await v.rpc('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(UserAccount.sendResetPasswordEmail);
      });

      test('invalid email', async () => {
        const res = await v.rpc('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(UserAccount.sendResetPasswordEmail);
      });

      test('user without userAccount', async () => {
        const user = await Factory.buildUser({email: 'foo@bar.com'});
        await User._insertAttrs(user.changes);
        const res = await v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(UserAccount.sendResetPasswordEmail);
      });

      test('success', async () => {
        const user = await Factory.buildUser({email: 'foo@bar.com'});
        await user.$save('force');
        const res = await v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(Val.ensureString, 'foo@bar.com  ');

        assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));
      });
    });
  });
});
