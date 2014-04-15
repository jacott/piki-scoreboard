App.require('AppModel.Result', function (model) {
  model.eventCatIndex = model.Index.addUniqueIndex('event_id', 'category_id', 'climber_id');

  App.extend(model.prototype, {
    setScore: function (index, score) {
      var num = new AppModel.Heat(index, this.event.heats[this.category_id]).scoreToNumber(score, index);
      if (index === 99 && this.time === num) return;
      if (this.scores[index] === num) return;

      App.rpc('Result.setScore', this._id, index, score);
    },

    setBoulderScore: function (index, problem, bonus, top) {
      if (this.problems) {
        var round = this.problems[index-1];
        if (round && round[problem-1] === bonus+top*100)
          return;
      }
      App.rpc('Result.setBoulderScore', this._id, index, problem, bonus, top);
    },
  });
});
