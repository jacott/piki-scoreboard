define((require, exports, module)=>{
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const Random          = require('koru/random').global;
  const util            = require('koru/util');
  const Model           = require('model');
  const Category        = require('./category');
  const Competitor      = require('./competitor');
  const Event           = require('./event');
  const Heat            = require('./heat');
  const User            = require('./user');

  class Result extends Model.BaseModel {
    unscoredHeat() {
      return this.scores.length;
    }

    displayTimeTaken() {
      if (this.time == null) return '';
      var minutes = this.time % 60;
      if (minutes < 10)
        minutes = '0' + minutes;
      return Math.floor(this.time / 60) + ':' + minutes;
    }

    get org_id() {
      return this.event && this.event.org_id;
    }
  }
  Result.define({
    module,
    fields: {
      event_id: 'belongs_to',
      climber_id: 'belongs_to',
      competitor_id: 'belongs_to',
      category_id: 'belongs_to',
      time: 'integer',
      scores: 'object',
      problems: 'object',
    },
  });

  Result.registerObserveField('event_id');

  Result.remote({
    setScore(id, index, score) {
      Val.ensureString(id, score);
      Val.ensureNumber(index);

      var user = User.findById(this.userId);
      var result = Result.findById(id);
      var event = result.event;

      Val.allowAccessIf(! event.closed && user && user.canJudge(event));

      var heat = new Heat(index, event.heats[result.category_id]);

      if (index === 99) {
        var time =  heat.scoreToNumber(score, 99);
        Val.allowAccessIf(time !== false);
        Result.query.onId(id).update({time: time});
        return;
      }

      Val.allowAccessIf(heat.type === 'L' && index >=0 && index <= heat.total);

      Result.query.onId(id).updatePartial(
        'scores',
        [`${index}.$partial`, ['$replace', heat.scoreToNumber(score) || null]]);
    },

    setBoulderScore(id, index, problem, bonus, top) {
      Val.ensureString(id);
      if (bonus === "dnc" || bonus == null)
        Val.ensureNumber(index, problem);
      else
        Val.ensureNumber(index, problem, bonus, top);

      var user = User.findById(this.userId);
      var result = Result.findById(id);
      var event = result.event;

      Val.allowAccessIf(user && user.canJudge(event));

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
        Val.allowIfValid(! top || bonus <= top);
        if (! bonus && top) {
          bonus = top;
        }

        Val.allowIfValid(top < 100 && bonus < 100 &&
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

      Result.query.onId(id).updatePartial(
        'problems', [`${index - 1}.$partial`, ['$replace', round || null]],
        'scores', [`${index}.$partial`, [
          '$replace',
          dnc === "dnc"
            ? -1
            : score = heat.boulderScoreToNumber(b, ba, t, ta, event.ruleVersion) || null]]
      );
    },
  });

  const addResults = (ids, doc)=>{
    ids.forEach(catId =>{
      Result.create({
        category_id: catId, event_id: doc.event_id,
        climber_id: doc.climber_id,
        competitor_id: doc._id,
        scores: [Random.fraction()],
      });
    });
  };

  const removeResults = (ids, doc)=>{
    ids.forEach(catId =>{
      Result.query.where({
        climber_id: doc.climber_id, category_id: catId, event_id: doc.event_id}).remove();
    });
  };

  Result.beforeCreate(Result, doc =>{
    const event = Event.findById(doc.event_id);
    if (event.heats && doc.category_id in event.heats) return;
    Event.query.onId(doc.event_id).updatePartial('heats', buildHeat(doc, ! event.heats));
  });

  Result.beforeRemove(Result, doc =>{
    if (Result.query.where({
      event_id: doc.event_id, category_id: doc.category_id}).whereNot('_id', doc._id).count(1))
      return;

    Event.query.onId(doc.event_id).updatePartial('heats', [doc.category_id]);
  });

  const buildHeat = (doc, newHeats)=>{
    const category  = Category.findById(doc.category_id);
    return [doc.category_id, category.type + category.heatFormat];
  };

  Result.beforeCreate(Competitor, doc =>{addResults(doc.category_ids || [], doc)});

  Result.beforeUpdate(Competitor, doc =>{
    const added = util.diff(doc.changes.category_ids || [], doc.attributes.category_ids || []);
    addResults(added, doc);

    const removed = util.diff(doc.attributes.category_ids || [], doc.changes.category_ids || []);
    removeResults(removed, doc);
  });

  Result.beforeRemove(Competitor, doc =>{removeResults(doc.category_ids || [], doc)});

  require('koru/env!./result')(Result);

  return Result;
});
