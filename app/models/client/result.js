App.require('AppModel.Result', function (model) {
  model.eventCatIndex = model.Index.addUniqueIndex('event_id', 'category_id', 'climber_id');
});
