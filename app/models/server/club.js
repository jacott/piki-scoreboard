App.require('AppModel.Club', function (model) {
  App.extend(model.prototype, {
    authorize: function (userId) {
    },
  });

  model.registerObserveField('org_id');
});
