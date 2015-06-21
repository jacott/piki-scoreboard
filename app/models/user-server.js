define(function(require, exports, module) {
  var util = require('koru/util');
  var Val = require('koru/model/validation');
  var UserAccount = require('koru/user-account');
  var session = require('koru/session');

  return function (model) {
    var FIELD_SPEC = {
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
        UserAccount.sendResetPasswordEmail(doc._id);
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
        accUser && UserAccount.sendResetPasswordEmail(user._id);
      }
      return {success: true};
    });
  };
});
