define(function(require, exports, module) {
  const Val         = require('koru/model/validation');
  const session     = require('koru/session');
  const UserAccount = require('koru/user-account');
  const util        = require('koru/util');

  return function (model) {
    const FIELD_SPEC = {
      name: 'string',
      email: 'string',
      initials: 'string',
      org_id: 'string',
      role: 'string',
    };

    require(['./change-log'], function (ChangeLog) {
      ChangeLog.logChanges(model);
    });

    model.registerObserveField('org_id');

    model.onChange(function (doc, was) {
      if (was === null) {
        UserAccount.createUserLogin({email: doc.email, userId: doc._id});
        UserAccount.sendResetPasswordEmail(doc);
      }
    });

    util.extend(model, {
      guestUser: function () {
        return model.findById('guest') || (
          model.docs.insert({_id: 'guest', role: 'g'}),
          model.findById('guest'));
      },
    });

    util.extend(model.prototype, {
      authorize: function (userId) {
        var role = model.ROLE;

        Val.assertDocChanges(this, FIELD_SPEC);

        var authUser = model.query.where({
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

      var user = model.findBy('email', email);
      if (user) {
        var accUser = UserAccount.model.findBy('userId', user._id);
        accUser && UserAccount.sendResetPasswordEmail(user);
      }
      return {success: true};
    });
  };
});
