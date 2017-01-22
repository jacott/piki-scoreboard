define(function (require, exports, module) {
  const koru        = require('koru');
  const Val         = require('koru/model/validation');
  const session     = require('koru/session');
  const UserAccount = require('koru/user-account');
  const ChangeLog   = require('models/change-log');
  const TH          = require('test-helper');

  const User        = require('./user');
  var v;

  TH.testCase(module, {
    setUp() {
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test guestUser"() {
      const guest = User.guestUser();
      assert.equals(guest._id, 'guest');
      assert.equals(guest.role, 'g');

      assert.equals(guest.attributes, User.guestUser().attributes);
    },

    "test authorize"() {
      TH.noInfo();
      const subject = TH.Factory.createUser();
      let user = TH.Factory.createUser('su');

      refute.accessDenied(function () {
        subject.authorize(user._id);
      });

      user = TH.Factory.createUser({role: 'j'});

      assert.accessDenied(function () {
        subject.authorize(user._id);
      });
    },

    "test admin deleting superuser"() {
      TH.noInfo();
      const org = TH.Factory.createOrg();
      const subject = TH.Factory.createUser({org_id: org._id, role: User.ROLE.admin});
      const user = TH.Factory.createUser('su', {org_id: org._id});

      assert.accessDenied(function () {
        user.authorize(subject._id);
      });
    },

    "test createUser"() {
      this.stub(UserAccount, 'sendResetPasswordEmail', function (user, token) {
        assert(User.exists({_id: user._id}));
      });
      TH.loginAs(TH.Factory.createUser('su'));
      const user = TH.Factory.buildUser();
      ChangeLog.docs.remove({});
      user.$$save();

      const mUser = UserAccount.model.findBy('userId', user._id);

      assert(mUser);

      assert.equals(mUser.email, user.email);

      assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));

      assert.same(ChangeLog.query.count(), 1);
    },

    "test change email"() {
      TH.Factory.createUser('su');
      TH.login();

      const rpc = TH.mockRpc(v);
      rpc('save', 'User', TH.userId(), {email: "foo@bar.com"});

      const user = User.findById(TH.userId());

      assert.same(user.email, "foo@bar.com");

      const ul = UserAccount.model.findBy('userId', user._id);

      assert.same(ul.email, user.email);
    },

    "forgotPassword": {
      setUp() {
        this.stub(Val, 'ensureString');
        this.stub(UserAccount, 'sendResetPasswordEmail');
        v.rpc = TH.mockRpc();
      },

      "test missing email"() {
        const res = v.rpc('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(UserAccount.sendResetPasswordEmail);
      },

      "test invalid email"() {
        const res = v.rpc('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(UserAccount.sendResetPasswordEmail);
      },

      "test user without userAccount"() {
        const user = TH.Factory.createUser({email: 'foo@bar.com'});
        const res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(UserAccount.sendResetPasswordEmail);
      },

      "test success"() {
        const user = TH.Factory.buildUser({email: 'foo@bar.com'});
        user.$save('force');
        const res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(Val.ensureString, 'foo@bar.com  ');

        assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));
      },
    }
  });
});
