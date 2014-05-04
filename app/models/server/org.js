App.require('AppModel.Org', function (model) {
  AppModel.ChangeLog.logChanges(model);

  App.extend(model.prototype, {
    authorize: function (userId) {
      AppVal.allowAccessIf(AppModel.User.exists({_id: userId, role: AppModel.User.ROLE.superUser}));
    },
  });
});
