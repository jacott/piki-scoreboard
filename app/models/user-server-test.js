define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var User = require('./user');
  var env = require('koru/env');
  var session = require('koru/session');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      test.stub(env, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test guestUser": function () {
      var guest = User.guestUser();
      assert.equals(guest._id, 'guest');
      assert.equals(guest.role, 'g');

      assert.equals(guest.attributes, User.guestUser().attributes);
    },

    "test authorize": function () {
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

    "test admin deleting superuser": function () {
      var org = TH.Factory.createOrg();
      var subject = TH.Factory.createUser({org_id: org._id, role: User.ROLE.admin});
      var user = TH.Factory.createUser('su', {org_id: org._id});

      assert.accessDenied(function () {
        user.authorize(subject._id);
      });
    },

    "//test createUser": function () {
      test.stub(Accounts, 'sendResetPasswordEmail');
      TH.loginAs(TH.Factory.createUser('su'));
      var user = TH.Factory.buildUser();
      user.$$save();

      var mUser = Meteor.users.findOne(user._id);

      assert(mUser);

      assert.equals(mUser.emails, [{address: user.email, verified: false}]);

      assert.calledWith(Accounts.sendResetPasswordEmail, user._id);

      // and remove
      user.$remove();
      refute(Meteor.users.findOne(user._id));
    },

    "test change email": function () {
      TH.Factory.createUser('su');
      TH.login();

      var rpc = TH.mockRpc("1");
      rpc('save', 'User', TH.userId(), {email: "foo@bar.com"});

      var user = User.findById(TH.userId());

      assert.same(user.email, "foo@bar.com");
    },

    "//forgotPassword": {
      setUp: function () {
        test.stub(global, 'check');
        test.stub(Accounts, 'sendResetPasswordEmail');
      },

      "test missing email": function () {
        var res = App.rpc('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(Accounts.sendResetPasswordEmail);
      },

      "test invalid email": function () {
        var res = App.rpc('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(Accounts.sendResetPasswordEmail);
      },

      "test user without meteor account": function () {
        var user = TH.Factory.createUser({email: 'foo@bar.com'});
        Meteor.users.remove(user._id);
        var res = App.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(Accounts.sendResetPasswordEmail);
      },

      "test success": function () {
        var user = TH.Factory.createUser({email: 'foo@bar.com'});
        var res = App.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(check, 'foo@bar.com  ', String);

        assert.calledWith(Accounts.sendResetPasswordEmail, user._id);
      },
    }


  });
});
