App.require('AppModel.Competitor', function (Competitor) {
  var model = AppModel.Base.defineSubclass('Result',{
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
  },{saveRpc: true});


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
      check([id, score], [String]);
      check(index, Number);

      var user = AppModel.User.findById(this.userId);
      var result = AppModel.Result.findById(id);
      var event = result.event;

      AppVal.allowAccessIf(user && (user.isSuperUser() || user.org_id === event.org_id));

      var heat = new AppModel.Heat(index, event.heats[result.category_id]);

      if (index === 99) {
        var time =  heat.scoreToNumber(score, 99);
        AppVal.allowAccessIf(time !== false);
        recordScoreChange(result, {time: result.time}, {time: time});
        model.docs.update(id, {$set: {time: time}});
        return;
      }

      AppVal.allowAccessIf(heat.type === 'L' && index >=0 && index <= heat.total);


      var changes = {};

      changes['scores.' + index] = score = heat.scoreToNumber(score);

      recordScoreChange(result, {score: result.scores[index]}, {index: index, score: score});
      model.fencedUpdate(id, {$set: changes});
    },

    setBoulderScore: function (id, index, problem, bonus, top) {
      check(id, String);
      if (bonus === "dnc" || bonus == null)
        check([index, problem], [Number]);
      else
        check([index, problem, bonus, top], [Number]);

      var user = AppModel.User.findById(this.userId);
      var result = AppModel.Result.findById(id);
      var event = result.event;

      AppVal.allowAccessIf(user && (user.isSuperUser() || user.org_id === event.org_id));

      var heat = new AppModel.Heat(index, event.heats[result.category_id]);

      --problem;
      var changes = {};

      var problems = result.problems || {};
      var round = problems[index-1] || [];
      var b4ProbScore = round[problem];

      AppVal.allowAccessIf(heat.type === 'B'  &&
                           index >=0 && index <= heat.total &&
                           problem >= 0 && problem < heat.problems );

      if (typeof bonus === "number") {
        if (top && bonus > top) {
          top = bonus;
        } else if (! bonus && top) {
          bonus = top;
        }

        AppVal.allowAccessIf(top < 100 && bonus < 100 &&
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
      model.fencedUpdate(id, {$set: changes});
    },
  });

  Competitor.afterCreate(function (doc) {
    addResults(doc.category_ids || [], doc);
  });

  Competitor.afterUpdate(function (doc) {
    var added = _.difference(doc.changes.category_ids || [], doc.attributes.category_ids || []);

    addResults(added, doc);
    var removed = _.difference(doc.attributes.category_ids || [], doc.changes.category_ids || []);
    removeResults(removed, doc);
  });

  Competitor.afterRemove(function (doc) {
    removeResults(doc.category_ids || [], doc);
  });

  function addResults(ids, doc) {
    ids.forEach(function (catId) {
      var result = model.create({
        category_id: catId, event_id: doc.event_id,
        climber_id: doc.climber_id,
        scores: [Meteor.isClient ? 0 : Math.random()],
      });
    });
  }

  function removeResults(ids, doc) {
    ids.forEach(function (catId) {
      model.docs.remove({climber_id: doc.climber_id, category_id: catId, event_id: doc.event_id});
    });
  }

  function recordScoreChange(result, before, after) {
    if (Meteor.isClient) return;

    var params = {
      user_id: App.userId(),
      org_id: result.event.org_id,
      parent: 'Event', parent_id: result.event_id,
      model: 'Result', model_id: result._id,
      type: 'update',
      aux: 'score',
      before: JSON.stringify(before),
      after: JSON.stringify(after),
    };

    AppModel.ChangeLog.create(params);
  }

  App.loaded('AppModel.Result', model);
});
