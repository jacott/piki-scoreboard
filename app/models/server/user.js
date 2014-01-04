App.require('AppModel.User', function (model) {
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
        var org = AppModel.Org.findOne();
        if (! org) return;
        guestUserId = model.docs.insert({role: 'g', org_id: org._id});
      }
      return new AppModel.User(model.attrFind(guestUserId));
    },
  });

  App.extend(model.prototype, {
    authorize: function (userId) {
      AppVal.allowAccessIf(AppModel.User.exists({_id: userId, role: AppModel.User.ROLE.superUser}));
    },
  });

  model.registerObserveField('org_id');
});
