App.require('AppModel.User', function (model) {
  var permitSpec = AppVal.permitSpec('name', 'email', 'initials', 'org_id', 'role');

  var guestUserId;
  App.extend(model, {
    _clearGuestUser: function () {
      guestUserId = null;
    },

    guestUser: function () {
      if (! guestUserId) {
        var user = model.findOne({role: 'g'});
        if (user) {
          guestUserId = user._id;
          return user;
        }
        guestUserId = model.docs.insert({role: 'g'});
      }
      return new AppModel.User(model.attrFind(guestUserId));
    },
  });

  Accounts.onCreateUser(function (options, user) {
    if (App.SETUP) return user;

    user._id = options.profile.id;
    user.emails = [{address: options.email, verified: false}];
    delete user.username;

    if (Meteor.users.find(user._id).count() === 0) {
      return user;
    }
  });

  model.afterUpdate(function (user) {
    if ('email' in user.changes) {
      Meteor.users.update(user._id, {$set: {emails: [{address: user.email, verified: false}]}});
    }
  });

  model.afterCreate(function (doc) {
    Accounts.createUser({email: doc.email, password: "changeme", profile: {id: doc._id}});
  });

  App.extend(model.prototype, {
    authorize: function (userId) {
      var role = AppModel.User.ROLE;

      AppVal.permitDoc(this, permitSpec);

      var authUser = AppModel.User.findOne({
        _id: userId,
        role: {$in: [role.superUser, role.admin]}
      });

      AppVal.allowAccessIf(authUser);

      AppVal.allowAccessIf(this.$isNewRecord() || authUser.isSuperUser() || this.attributes.role !== role.superUser);
    },
  });

  model.registerObserveField('org_id');

  Meteor.methods({
    "User.forgotPassword": function (email, challenge, response) {
      check(email, String);
      email = email.trim();
      if (!email) {
         return {email: 'is_required' };
      }
      email = Apputil.parseEmailAddresses(email);
      if (! email || email.addresses.length !== 1 || email.remainder)
        return {email: 'is_invalid' };

      email = email.addresses[0].toLowerCase();

      var user = model.findOne({email: email});
      if (user) {
        var accUser = Meteor.users.findOne(user._id);
        accUser && Accounts.sendResetPasswordEmail(user._id);
      }
      return {success: true};
    },
  });

  (function () {
    var TEXT = App.format.compile(Assets.getText('reset-password.txt'));

    Accounts.emailTemplates.resetPassword.text = function (user, url) {
      user = AppModel.User.findOne(user._id);

      return App.format(TEXT, {user: user, url: url.replace(/\/#\//,'/')});
    };
  })();
});
