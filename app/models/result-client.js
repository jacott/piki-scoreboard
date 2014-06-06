define(function(require, exports, module) {
  var util = require('koru/util');
  var session = require('koru/session');
  var Heat = require('./heat');

  return function (model) {
    model.eventCatIndex = model.addUniqueIndex('event_id', 'category_id', 'climber_id');

    util.extend(model.prototype, {
      setScore: function (index, score) {
        var num = new Heat(index, this.event.heats[this.category_id]).scoreToNumber(score, index);
        if (index === 99 && this.time === num) return;
        if (this.scores[index] === num) return;

        session.rpc('Result.setScore', this._id, index, score);
      },

      setBoulderScore: function (index, problem, bonus, top) {
        if (this.problems) {
          var round = this.problems[index-1];
          if (round && round[problem-1] === (bonus === "dnc" ? -1 : bonus === undefined ? null : bonus+top*100))
            return;
        }
        session.rpc('Result.setBoulderScore', this._id, index, problem, bonus, top);
      },
    });

  };
});
