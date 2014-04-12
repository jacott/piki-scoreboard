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

      var user = AppModel.User.findOne(this.userId);
      var result = AppModel.Result.findOne(id);
      var event = result.event;

      AppVal.allowAccessIf(user && (user.isSuperUser() || user.org_id === event.org_id));

      var heat = new AppModel.Heat(index, event.heats[result.category_id]);

      if (index === 99) {
        var time =  heat.scoreToNumber(score, 99);
        AppVal.allowAccessIf(time !== false);
        model.docs.update(id, {$set: {time: time}});
        return;
      }

      AppVal.allowAccessIf(heat.type === 'L' && index >=0 && index <= heat.total);


      var changes = {};

      changes['scores.' + index] = heat.scoreToNumber(score);

      model.fencedUpdate(id, {$set: changes});
    },

    setBoulderScore: function (id, index, problem, bonus, top) {
      check(id, String);
      check([index, problem, bonus, top], [Number]);

      var user = AppModel.User.findOne(this.userId);
      var result = AppModel.Result.findOne(id);
      var event = result.event;

      AppVal.allowAccessIf(user && (user.isSuperUser() || user.org_id === event.org_id));

      var heat = new AppModel.Heat(index, event.heats[result.category_id]);

      --problem;

      if (top && bonus > top) {
        top = bonus;
      } else if (! bonus && top) {
        bonus = top;
      }

      AppVal.allowAccessIf(heat.type === 'B' && top < 100 && bonus < 100 && index >=0 && index <= heat.total &&
                           (top === 0 || top >= bonus) && (bonus !== 0 || top === 0) &&
                           problem >= 0 && problem < heat.problems );

      var changes = {};

      var problems = result.problems || {};
      var round = problems[index-1] || [];

      round[problem] = bonus+top*100;

      var b = 0, ba = 0, t = 0, ta = 0, score;

      for(var i = 0; i < round.length; ++i) {
        var row = round[i];
        if (row) {
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
      changes['scores.' + index] = heat.boulderScoreToNumber(b, ba, t, ta);

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

  App.loaded('AppModel.Result', model);
});
