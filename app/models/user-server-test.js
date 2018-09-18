define((require, exports, module)=>{
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
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
      v = {};
    });

    group("observeOrg_id", ()=>{
      let dc;
      beforeEach(()=>{
        v.org = Factory.createOrg();
        const cb = v => {dc = v.clone()};
        onEnd(User.observeOrg_id([v.org._id], cb));
        v.user = User.create({
          email: 'foo@bar.com', name: 'foo', initials: 'F'});
      });

      afterEach(()=>{
        dc = undefined;
      });

      test("role", ()=>{
        const org_id = v.org._id;
        const {user} = v;
        assert.same(dc, undefined);

        const role = Role.create({user_id: user._id, org_id, role: 'a'});

        assert.equals(dc.doc.attributes, {
          org_id, role: 'a',
          email: user.email, name: user.name, initials: user.initials,
          _id: user._id
        });
        assert.equals(v.undo, null);

        role.$update('role', 'j');

        assert.equals(dc.doc.attributes.role, 'j');
        assert.equals(dc.undo, {role: 'a'});

        role.$remove();
        assert(dc.isDelete);
        assert.equals(dc.doc.attributes, {
          org_id, role: 'j',
          email: user.email, name: user.name, initials: user.initials,
          _id: user._id
        });
      });

      test("user field", ()=>{
        const {user} = v;
        const org1 = v.org;
        const org2 = Factory.createOrg();
        let dc2;
        const cb2 = dc => {dc2 = dc.clone()};
        onEnd(User.observeOrg_id([org2._id], cb2));

        const role1 = Role.create({user_id: user._id, org_id: org1._id, role: 'j'});
        const role2 = Role.create({user_id: user._id, org_id: org2._id, role: 'a'});

        user.$update('name', 'new name');

        assert.equals(dc.doc.name, 'new name');
        assert.equals(dc.doc.attributes.org_id, org1._id);
        assert.equals(dc2.doc.name, 'new name');
        assert.equals(dc2.doc.attributes.org_id, org2._id);
      });
    });

    test("guestUser", ()=>{
      const guest = User.guestUser();
      assert.equals(guest._id, 'guest');

      assert.equals(guest.attributes, User.guestUser().attributes);
    });

    test("canAdminister", ()=>{
      const org_id = Factory.createOrg()._id;
      const doc = Factory.createUser({org_id: undefined, role: 's'});
      const role = Role.query.fetchOne();

      refute(doc.canAdminister());
      refute(doc.canAdminister('x'));

      role.$update({org_id, role: User.ROLE.admin});
      util.thread.connection = {org_id};

      refute(doc.canAdminister());
      assert(doc.canAdminister({attributes: {org_id}}));
      assert(doc.canAdminister({attributes: {}, org_id}));
      refute(doc.canAdminister({attributes: {org_id: '456'}, org_id}));

      role.$update({role: User.ROLE.judge});

      refute(doc.canAdminister());
    });

    group("authorize", ()=>{
      test("accessDenied", ()=>{
        TH.noInfo();
        const org = Factory.createOrg();
        const subject = Factory.createUser({_id: 'subjUser'});
        subject.changes = {org_id: org._id};
        { /** super user okay **/
          const user = Factory.createUser('su', {_id: 'suUser'});
          refute.accessDenied(()=>{subject.authorize(user._id)});
        }

        { /** admin user not okay if more than one role **/
          const user = Factory.createUser('admin', {_id: 'adminUser'});
          subject.changes = {role: 'j', name: 'foo', org_id: org._id};
          refute.accessDenied(()=>{subject.authorize(user._id)}); // one okay


          Factory.createRole({user_id: subject._id, org_id: 'org2', role: 'j'});
          assert.accessDenied(()=>{subject.authorize(user._id)}); // two not okay

          delete subject.changes.name;
          refute.accessDenied(()=>{subject.authorize(user._id)}); // unless change just role

          subject.changes.name = 'foo';
          Role.db.query(`delete from "Role" where user_id = '${subject._id}'`);
          refute.accessDenied(()=>{subject.authorize(user._id)}); // none okay
        }

        { /** judge not okay **/
          const user = Factory.createUser({role: 'j'});
          subject.changes = {role: 'j', name: 'foo'};
          assert.accessDenied(()=>{subject.authorize(user._id)});
          subject.changes = {role: 'j'};
          assert.accessDenied(()=>{subject.authorize(user._id)});
        }
      });

      test("org_is not in changes", ()=>{
        const org = Factory.createOrg();
        const subject = Factory.createUser({_id: 'subjUser'});
        const admin = Factory.createUser('admin', {_id: 'adminUser'});
        const user = Factory.createUser('su', {_id: 'suUser'});
        user.changes = {name: 'new name'};
        TH.noInfo();
        assert.exception(()=>{
          user.authorize(admin._id);
        }, {error: 403});
      });

      test("new record same email", ()=>{
        const org = Factory.createOrg();
        const subject = Factory.createUser({_id: 'subjUser'});
        const org2 = Factory.createOrg();
        const admin = Factory.createUser('admin', {_id: 'adminUser'});

        const sub2 = new User({});
        sub2.changes = {
          _id: 'sub2', org_id: org2._id,
          name: 'sub 2', initials: 'S2',
          email: '   '+subject.email.toUpperCase()+'   ', role: 'c',
        };

        sub2.authorize(admin._id);

        assert.equals(sub2.changes, {org_id: org2._id, role: 'c'});
        assert.equals(sub2.attributes, subject.attributes);
      });

      test("new record new email", ()=>{
        const org = Factory.createOrg();
        const subject = Factory.createUser({_id: 'subjUser'});
        const org2 = Factory.createOrg();
        const admin = Factory.createUser('admin', {_id: 'adminUser'});

        const sub2 = new User({});
        sub2.changes = {
          _id: 'sub2', org_id: org2._id,
          name: 'sub 2', initials: 'S2',
          email: 'new'+subject.email, role: 'c',
        };

        sub2.authorize(admin._id);

        assert.equals(sub2.changes, {
          _id: 'sub2', org_id: org2._id,
          name: 'sub 2', initials: 'S2',
          email: 'new'+subject.email, role: 'c',
        });
        assert.equals(sub2.attributes, {});
      });

      test("admin changing superuser", ()=>{
        TH.noInfo();
        const org = Factory.createOrg();
        const user = Factory.createUser({_id: 'userId', org_id: org._id, role: User.ROLE.admin});
        const subject = Factory.createUser('su', {_id: 'subjectId'});
        subject.changes = {org_id: org._id, role: 'a'};

        assert.accessDenied(()=>{subject.authorize(user._id)});
      });

      test("self change", ()=>{
        const org = Factory.createOrg();
        const subject = Factory.createUser({_id: 'subjUser', role: 'c'});
        subject.changes = {org_id: org._id};
        refute.accessDenied(()=>{subject.authorize(subject._id)});
      });
    });

    test("make su", ()=>{
      const org = Factory.createOrg();
      const subject = Factory.createUser({_id: 'subjUser', role: 'c'});
      const org2 = Factory.createOrg();
      Role.create({org_id: org2._id, user_id: subject._id, role: 'a'});

      subject.changes = {org_id: org._id, role: 's'};

      subject.$$save();

      assert.equals(Role.query.map(r => [r.org_id, r.user_id, r.role]), [[
        undefined, 'subjUser', 's'
      ]]);
    });

    test("make not su", ()=>{
      const org = Factory.createOrg();
      const subject = Factory.createUser('su', {_id: 'subjUser'});

      subject.changes = {org_id: org._id, role: 'c'};

      subject.$$save();

      assert.equals(Role.query.map(r => [r.org_id, r.user_id, r.role]), [[
        org._id, 'subjUser', 'c'
      ]]);

    });

    test("role changes", ()=>{
      const user = Factory.createUser();
      const org2 = Factory.createOrg();
      user.changes = {org_id: org2._id, role: 'c'};

      stub(UserAccount, 'sendResetPasswordEmail');

      user.$$save();

      assert(Role.exists({org_id: org2._id, user_id: user._id, role: 'c'}));

      assert.calledWith(UserAccount.sendResetPasswordEmail, user);

      assert(UserAccount.model.exists({userId: user._id, email: user.email}));

      user.changes = {org_id: org2._id, role: 'a'};

      user.$$save();

      assert(Role.exists({org_id: org2._id, user_id: user._id, role: 'a'}));
    });

    test("delete", ()=>{
      const org2 = Factory.createOrg();
      const user = Factory.createUser();
      UserAccount.createUserLogin({email: user.email, userId: user._id});
      user.changes = {org_id: org2._id, role: null};

      user.$$save();

      refute(Role.exists({org_id: org2._id, user_id: user._id}));
      refute(UserAccount.model.exists({email: user.email}));

      /** make sure does not create is missing **/
      user.changes = {org_id: org2._id, role: null};

      user.$$save();

      refute(Role.exists({org_id: org2._id, user_id: user._id}));
    });

    test("createUser", ()=>{
      stub(UserAccount, 'sendResetPasswordEmail', (user, token)=>{
        assert(User.exists({_id: user._id}));
      });
      TH.loginAs(Factory.createUser('su'));
      const user = Factory.buildUser();
      ChangeLog.docs.remove({});
      user.$$save();

      const mUser = UserAccount.model.findBy('userId', user._id);

      assert(mUser);

      assert.equals(mUser.email, user.email);

      assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));

      assert.same(ChangeLog.query.count(), 1);
    });

    test("change email", ()=>{
      const org = Factory.createOrg();
      Factory.createUser('su');
      TH.login();

      const rpc = TH.mockRpc(v);
      rpc('save', 'User', TH.userId(), {email: "foo@bar.com", org_id: org._id});

      const user = User.findById(TH.userId());

      assert.same(user.email, "foo@bar.com");

      const ul = UserAccount.model.findBy('userId', user._id);

      assert.same(ul.email, user.email);
    });

    group("forgotPassword", ()=>{
      beforeEach(()=>{
        stub(Val, 'ensureString');
        stub(UserAccount, 'sendResetPasswordEmail');
        v.rpc = TH.mockRpc();
      });

      test("missing email", ()=>{
        const res = v.rpc('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(UserAccount.sendResetPasswordEmail);
      });

      test("invalid email", ()=>{
        const res = v.rpc('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(UserAccount.sendResetPasswordEmail);
      });

      test("user without userAccount", ()=>{
        const user = Factory.buildUser({email: 'foo@bar.com'});
        User._insertAttrs(user.changes);
        const res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(UserAccount.sendResetPasswordEmail);
      });

      test("success", ()=>{
        const user = Factory.buildUser({email: 'foo@bar.com'});
        user.$save('force');
        const res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(Val.ensureString, 'foo@bar.com  ');

        assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));
      });
    });
  });
});
