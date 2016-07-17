define(function(require, exports, module) {
  const Val         = require('koru/model/validation');
  const session     = require('koru/session');
  const UserAccount = require('koru/user-account');
  const util        = require('koru/util');

  return function (User) {
    const FIELD_SPEC = {
      name: 'string',
      email: 'string',
      initials: 'string',
      org_id: 'string',
      role: 'string',
    };

    require(['./change-log'], function (ChangeLog) {
      ChangeLog.logChanges(User);
    });

    User.registerObserveField('org_id');

    User.onChange(function (doc, was) {
      if (was === null) {
        UserAccount.createUserLogin({email: doc.email, userId: doc._id});
        UserAccount.sendResetPasswordEmail(doc);
      }
    });

    util.extend(User, {
      guestUser() {
        return User.findById('guest') || (
          User.docs.insert({_id: 'guest', role: 'g'}),
          User.findById('guest'));
      },
    });

    util.extend(User.prototype, {
      authorize(userId) {
        var role = User.ROLE;

        Val.assertDocChanges(this, FIELD_SPEC);

        var authUser = User.query.where({
          _id: userId,
          role: {$in: [role.superUser, role.admin]},
        }).fetchOne();

        Val.allowAccessIf(authUser);

        Val.allowAccessIf(this.$isNewRecord() || authUser.isSuperUser() || this.attributes.role !== role.superUser);
      },
    });

    session.defineRpc("User.forgotPassword", function (email, challenge, response) {
      Val.ensureString(email);

      email = email.trim();
      if (!email) {
        return {email: 'is_required' };
      }
      email = util.parseEmailAddresses(email);
      if (! email || email.addresses.length !== 1 || email.remainder)
        return {email: 'is_invalid' };

      email = email.addresses[0].toLowerCase();

      var user = User.findBy('email', email);
      if (user) {
        var accUser = UserAccount.model.findBy('userId', user._id);
        accUser && UserAccount.sendResetPasswordEmail(user);
      }
      return {success: true};
    });
  };
});
