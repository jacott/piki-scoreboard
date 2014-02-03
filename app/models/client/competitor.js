App.require('AppModel.Competitor', function (model) {
  model.eventIndex = model.Index.addUniqueIndex('event_id', 'climber_id');
});
