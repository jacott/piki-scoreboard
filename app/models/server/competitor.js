App.require('AppModel.Competitor', function (model) {
  App.extend(model.prototype, {
    authorize: function (userId) {
      var user = AppModel.User.findOne(userId);

      check(this.event_id, String);
      var event = AppModel.Event.findOne(this.attributes.event_id || this.event_id);
      AppVal.allowAccessIf(user && event && user.org_id === event.org_id || user.role.indexOf(AppModel.User.ROLE.superUser) >= 0);
    },
  });

  model.registerObserveField('event_id');

});
