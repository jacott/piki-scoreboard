App.require('AppModel.Climber', function (model) {
  AppModel.ChangeLog.logChanges(model);

  App.extend(model.prototype, {
    authorize: function (userId) {
      var user = AppModel.User.findOne(userId);
      AppVal.allowAccessIf(user && user.org_id === this.org_id || user.role.indexOf(AppModel.User.ROLE.superUser) >= 0);
    },
  });

  model.registerObserveField('org_id');
});
