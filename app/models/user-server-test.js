define(function (require, exports, module) {
  var test, v;
  const koru        = require('koru');
  const Val         = require('koru/model/validation');
  const session     = require('koru/session');
  const UserAccount = require('koru/user-account');
  const ChangeLog   = require('models/change-log');
  const TH          = require('test-helper');
  const User        = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      test.stub(koru, 'info');
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test guestUser"() {
      var guest = User.guestUser();
      assert.equals(guest._id, 'guest');
      assert.equals(guest.role, 'g');

      assert.equals(guest.attributes, User.guestUser().attributes);
    },

    "test authorize"() {
      var subject = TH.Factory.createUser();
      var user = TH.Factory.createUser('su');

      refute.accessDenied(function () {
        subject.authorize(user._id);
      });

      user = TH.Factory.createUser({role: 'j'});

      assert.accessDenied(function () {
        subject.authorize(user._id);
      });
    },

    "test admin deleting superuser"() {
      var org = TH.Factory.createOrg();
      var subject = TH.Factory.createUser({org_id: org._id, role: User.ROLE.admin});
      var user = TH.Factory.createUser('su', {org_id: org._id});

      assert.accessDenied(function () {
        user.authorize(subject._id);
      });
    },

    "test createUser"() {
      test.stub(UserAccount, 'sendResetPasswordEmail', function (user, token) {
        assert(User.exists({_id: user._id}));
      });
      TH.loginAs(TH.Factory.createUser('su'));
      var user = TH.Factory.buildUser();
      ChangeLog.docs.remove({});
      user.$$save();

      var mUser = UserAccount.model.findBy('userId', user._id);

      assert(mUser);

      assert.equals(mUser.email, user.email);

      assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));

      assert.same(ChangeLog.query.count(), 1);
    },

    "test change email"() {
      TH.Factory.createUser('su');
      TH.login();

      var rpc = TH.mockRpc(v);
      rpc('save', 'User', TH.userId(), {email: "foo@bar.com"});

      var user = User.findById(TH.userId());

      assert.same(user.email, "foo@bar.com");
    },

    "forgotPassword": {
      setUp() {
        test.stub(Val, 'ensureString');
        test.stub(UserAccount, 'sendResetPasswordEmail');
        v.rpc = TH.mockRpc();
      },

      "test missing email"() {
        var res = v.rpc('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(UserAccount.sendResetPasswordEmail);
      },

      "test invalid email"() {
        var res = v.rpc('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(UserAccount.sendResetPasswordEmail);
      },

      "test user without userAccount"() {
        var user = TH.Factory.createUser({email: 'foo@bar.com'});
        var res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(UserAccount.sendResetPasswordEmail);
      },

      "test success"() {
        var user = TH.Factory.buildUser({email: 'foo@bar.com'});
        user.$save('force');
        var res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(Val.ensureString, 'foo@bar.com  ');

        assert.calledWith(UserAccount.sendResetPasswordEmail, TH.matchModel(user));
      },
    }
  });
});
