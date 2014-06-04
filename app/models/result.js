define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var env = require('koru/env');
  var User = require('./user');
  var Heat = require('./heat');
  var Competitor = require('./competitor');
  var ChangeLog = require('./change-log');
  var Event = require('./event');
  var Category = require('./category');

  var model = require('model').define(module, {
    unscoredHeat: function () {
      return this.scores.length;
    },

    displayTimeTaken: function () {
      if (this.time == null) return '';
      var minutes = this.time % 60;
      if (minutes < 10)
        minutes = '0' + minutes;
      return Math.floor(this.time / 60) + ':' + minutes;
    },
  });

  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    category_id: 'belongs_to',
    time: 'number',
    scores: 'has-many',
    problems: 'has-many',
  });


  model.remote({
    setScore: function (id, index, score) {
      Val.ensureString(id, score);
      Val.ensureNumber(index);

      var user = User.findById(this.userId);
      var result = model.findById(id);
      var event = result.event;

      Val.allowAccessIf(user && (user.isSuperUser() || user.org_id === event.org_id));

      var heat = new Heat(index, event.heats[result.category_id]);

      if (index === 99) {
        var time =  heat.scoreToNumber(score, 99);
        Val.allowAccessIf(time !== false);
        recordScoreChange(result, {time: result.time}, {time: time});
        model.query.onId(id).update({time: time});
        return;
      }

      Val.allowAccessIf(heat.type === 'L' && index >=0 && index <= heat.total);


      var changes = {};

      changes['scores.' + index] = score = heat.scoreToNumber(score);

      recordScoreChange(result, {score: result.scores[index]}, {index: index, score: score});
      model.query.onId(id).update(changes);
    },

    setBoulderScore: function (id, index, problem, bonus, top) {
      Val.ensureString(id);
      if (bonus === "dnc" || bonus == null)
        Val.ensureNumber(index, problem);
      else
        Val.ensureNumber(index, problem, bonus, top);

      var user = User.findById(this.userId);
      var result = model.findById(id);
      var event = result.event;

      Val.allowAccessIf(user && (user.isSuperUser() || user.org_id === event.org_id));

      var heat = new Heat(index, event.heats[result.category_id]);

      --problem;
      var changes = {};

      var problems = result.problems || {};
      var round = problems[index-1] || [];
      var b4ProbScore = round[problem];

      Val.allowAccessIf(heat.type === 'B'  &&
                           index >=0 && index <= heat.total &&
                           problem >= 0 && problem < heat.problems );

      if (typeof bonus === "number") {
        if (top && bonus > top) {
          top = bonus;
        } else if (! bonus && top) {
          bonus = top;
        }

        Val.allowAccessIf(top < 100 && bonus < 100 &&
                             (top === 0 || top >= bonus) &&
                             (bonus !== 0 || top === 0));

        round[problem] = bonus+top*100;
      } else {
        round[problem] = bonus === "dnc" ? -1 : null;
      }

      var b = null, ba = 0, t = 0, ta = 0, score;
      var dnc = null;
      for(var i = 0; i < round.length; ++i) {
        var row = round[i];
        if (row === -1 && dnc === null)
          dnc = "dnc";
        else if (row === 0) {
          if (b == null) b = 0;
          dnc = false;
        } else if (row > 0) {
          dnc = false;
          if (score = row % 100) {
            ba += score;
            ++b;
          }
          if (score = Math.floor(row / 100)) {
            ta += score;
            ++t;
          }
        }
      }

      changes['problems.' + (index-1)] = round;
      changes['scores.' + index] = dnc === "dnc" ? -1 : score = heat.boulderScoreToNumber(b, ba, t, ta);

      recordScoreChange(result, {score: result.scores[index], probScore: b4ProbScore},
                        {index: index, problem: problem, score: score, probScore: round[problem]});
      model.query.onId(id).update(changes);
    },
  });

  model.beforeCreate(Competitor, function (doc) {
    addResults(doc.category_ids || [], doc);
  });

  model.beforeUpdate(Competitor, function (doc, changes) {
    var added = util.diff(changes.category_ids || [], doc.attributes.category_ids || []);

    addResults(added, doc);
    var removed = util.diff(doc.attributes.category_ids || [], changes.category_ids || []);
    removeResults(removed, doc);
  });

  model.beforeRemove(Competitor, function (doc) {
    removeResults(doc.category_ids || [], doc);
  });

  function addResults(ids, doc) {
    ids.forEach(function (catId) {
      var result = model.create({
        category_id: catId, event_id: doc.event_id,
        climber_id: doc.climber_id,
        scores: [isClient ? 0 : Math.random()],
      });
    });
  }

  function removeResults(ids, doc) {
    ids.forEach(function (catId) {
      model.query.where({climber_id: doc.climber_id, category_id: catId, event_id: doc.event_id}).remove();
    });
  }

  model.beforeCreate(model, function (doc) {
    var event = Event.findById(doc.event_id);
    if (event.heats && doc.category_id in event.heats) return;
    Event.query.onId(doc.event_id).update(buildHeat(doc, ! event.heats));
    });

  model.beforeRemove(model, function (doc) {
    if (model.query.where({event_id: doc.event_id, category_id: doc.category_id}).whereNot('_id', doc._id).count(1))
      return;

    var heat = {};
    heat["heats."+ doc.category_id] = undefined;
    Event.query.onId(doc.event_id).update(heat);
  });

  function buildHeat(doc, newHeats) {
    var category  = Category.findById(doc.category_id);
    var value = category.type + category.heatFormat;

    if (newHeats) {
      var heats = {};
        heats[doc.category_id] = value;
      return {heats: heats};
    } else {
      var heat = {};
      heat["heats."+doc.category_id] = value;
      return heat;
    }
  }


  function recordScoreChange(result, before, after) {
    if (isClient) return;

    var params = {
      user_id: env.userId(),
      org_id: result.event.org_id,
      parent: 'Event', parent_id: result.event_id,
      model: 'Result', model_id: result._id,
      type: 'update',
      aux: 'score',
      before: JSON.stringify(before),
      after: JSON.stringify(after),
    };

    ChangeLog.create(params);
  }

  require('koru/env!./result')(model);

  return model;
});
