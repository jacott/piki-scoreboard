App.require('AppModel.Result', function (model) {
  model.eventCatIndex = model.Index.addUniqueIndex('event_id', 'category_id', 'climber_id');

  App.extend(model.prototype, {
    setScore: function (index, score) {
      App.rpc('Result.setScore', this._id, index, score);
    },

    setBoulderScore: function (index, problem, bonus, top) {
      App.rpc('Result.setBoulderScore', this._id, index, problem, bonus, top);
    },
  });
});
