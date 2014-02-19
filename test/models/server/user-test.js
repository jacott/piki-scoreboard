(function (test, v) {
  buster.testCase('models/server/user:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppModel.User.clearMemDocs();
      v = null;
    },

    "test createUser": function () {
      TH.loginAs(TH.Factory.createUser('su'));
      var user = TH.Factory.buildUser();
      user.$$save();

      var mUser = Meteor.users.findOne(user._id);

      assert(mUser);

      assert.equals(mUser.emails, [{address: user.email, verified: false}]);
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

    "test guestUserId": function () {
      var user = AppModel.User.guestUser();

      assert.same(user.org_id, undefined);
      refute.same(AppModel.User.guestUser(), user);

      AppModel.User.addMemDoc(user.attributes);
      assert.same(AppModel.User.guestUser().attributes, user.attributes);
    },

    "test change email": function () {
      TH.Factory.createUser('su');
      TH.login();

      TH.call('User.save', TH.userId(), {email: "foo@bar.com"});

      var user = AppModel.User.findOne(TH.userId());

      assert.same(user.email, "foo@bar.com");
      var mu = Meteor.users.findOne(TH.userId());
      assert.equals(mu.emails, [{address: "foo@bar.com", verified: false}]);
    },

    "forgotPassword": {
      setUp: function () {
        test.stub(global, 'check');
        test.stub(Accounts, 'sendResetPasswordEmail');
      },

      "test missing email": function () {
        var res = Meteor.call('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(Accounts.sendResetPasswordEmail);
      },

      "test invalid email": function () {
        var res = Meteor.call('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(Accounts.sendResetPasswordEmail);
      },

      "test user without meteor account": function () {
        var user = TH.Factory.createUser({email: 'foo@bar.com'});
        Meteor.users.remove(user._id);
        var res = Meteor.call('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(Accounts.sendResetPasswordEmail);
      },

      "test success": function () {
        var user = TH.Factory.createUser({email: 'foo@bar.com'});
        var res = Meteor.call('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(check, 'foo@bar.com  ', String);

        assert.calledWith(Accounts.sendResetPasswordEmail, user._id);
      },
    }
  });
})();
