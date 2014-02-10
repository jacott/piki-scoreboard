App.require('AppModel.Result', function (model) {
  model.eventCatIndex = model.Index.addUniqueIndex('event_id', 'category_id', 'climber_id');

  App.extend(model.prototype, {
    setScore: function (index, score) {
      Meteor.call('Result.setScore', this._id, index, score);
    },
  });
});
