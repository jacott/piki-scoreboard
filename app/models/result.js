define((require, exports, module) => {
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const Random          = require('koru/random').global;
  const session         = require('koru/session');
  const util            = require('koru/util');
  const Category        = require('./category');
  const Competitor      = require('./competitor');
  const Event           = require('./event');
  const Heat            = require('./heat');
  const User            = require('./user');
  const Model           = require('model');

  const ALT_TIMES = {
    fall: true,
    fs: true,
    '-': true,
    wc: true,
    tie: true,
  };

  const SPEED_OPTIONS_SPEC = Val.matchFields({
    time: {type: 'any', validate() {
      const {time} = this;
      if (typeof time === 'number') {
        if (time === Math.floor(time) && time > 0 && time <= 6*60*1000) return;
      } else {
        if (time === undefined || ALT_TIMES[time] !== undefined) return;
      }
      Val.addError(this, 'time', 'is_invalid');
    }},
    attempt: {type: 'number', required: true, number: {integer: true, $gt: 0, $lt: 50}},
    stage: {type: 'number', number: {integer: true, $gte: 0, $lte: 4}},
    opponent_id: {type: 'id'},
  });

  class Result extends Model.BaseModel {
    unscoredHeat() {
      return this.scores.length;
    }

    displayTimeTaken() {
      if (this.time == null) return '';
      var minutes = this.time % 60;
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      return Math.floor(this.time / 60) + ':' + minutes;
    }

    get org_id() {
      return this.event && this.event.org_id;
    }

    setScore(index, score) {
      var num = new Heat(index, this.event.heats[this.category_id]).scoreToNumber(score, index);
      if (index === 99 && this.time === num) return;
      if (this.scores[index] === num) return;

      return session.rpc('Result.setScore', this._id, index, score);
    }

    setBoulderScore(index, problem, bonus, top) {
      if (this.problems) {
        var round = this.problems[index - 1];
        if (round && round[problem - 1] === (
          bonus === 'dnc' ? -1 : bonus === undefined ? null : bonus + top * 100)) {
          return;
        }
      }
      return session.rpc('Result.setBoulderScore', this._id, index, problem, bonus, top);
    }

    setSpeedScore(options) {
      return session.rpc('Result.setSpeedScore', this._id, options);
    }

    _doSetSpeedScore(options) {
      const scores = util.deepCopy(this.scores);
      const attemptIdx = options.attempt - 1;
      const {time} = options;
      const stage = options.stage ?? 0;

      if (stage !== 0) {
        // finals
        const {opponent_id} = options;
        if (opponent_id === undefined) {
          Val.allowIfValid(stage === 1);
          const score = scores[2] ??= [];
          score[attemptIdx] = time;
        } else {
          Val.allowIfValid(opponent_id !== undefined && opponent_id !== this._id);
          return ifPromise(Result.findById(opponent_id), (opponent) => {
            Val.allowIfValid(
              opponent !== undefined && opponent.event_id === this.event_id &&
                opponent.category_id === this.category_id);

            const stageIdx = stage + 1;
            const score = scores[stageIdx] ??= {};
            if (attemptIdx == 0) {
              if (time === undefined) {
                scores[stageIdx] = null;
              } else {
                score.time = time;
              }
            } else {
              (score.tiebreak ??= [])[attemptIdx - 1] = time;
            }
            score.opponent_id = options.opponent_id;

            return this.$update({scores});
          });
        }
      } else {
        //qualifiers
        const score = scores[1] ??= [];
        score[attemptIdx] = time;
      }

      return this.$update({scores});
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

  const assertCanJudge = (event, userId) => ifPromise(event, (event) => ifPromise(
    event != null && event.canJudge(userId), (okay) => (Val.allowAccessIf(okay), event)));

  Result.remote({
    setScore(id, index, score) {
      Val.ensureString(id, score);
      Val.ensureNumber(index);

      return ifPromise(Result.findById(id), (result) => ifPromise(assertCanJudge(result.event, this.userId), (event) => {
        const heat = new Heat(index, event.heats[result.category_id]);

        if (index === 99) {
          const time = heat.scoreToNumber(score, 99);
          Val.allowAccessIf(time !== false);
          return Result.query.onId(id).update({time});
        }

        Val.allowAccessIf(heat.type === 'L' && index >= 0 && index <= heat.total);

        return Result.query.onId(id).updatePartial(
          'scores',
          [`${index}.$partial`, ['$replace', heat.scoreToNumber(score) || null]]);
      }));
    },

    setSpeedScore(id, options) {
      return ifPromise(Result.findById(id), (result) => ifPromise(assertCanJudge(result.event, this.userId), (event) => {
        Val.assertCheck(options, SPEED_OPTIONS_SPEC);

        return result._doSetSpeedScore(options);
      }));
    },

    setBoulderScore(id, index, problem, bonus, top) {
      Val.ensureString(id);
      if (bonus === 'dnc' || bonus == null) {
        Val.ensureNumber(index, problem);
      } else {
        Val.ensureNumber(index, problem, bonus, top);
      }

      return ifPromise(Result.findById(id), (result) => ifPromise(assertCanJudge(result.event, this.userId), (event) => {
        const heat = new Heat(index, event.heats[result.category_id]);

        --problem;
        var changes = {};

        var problems = result.problems ?? {};
        var round = problems[index - 1] ?? [];
        var b4ProbScore = round[problem];

        Val.allowAccessIf(heat.type === 'B' &&
                          index >= 0 && index <= heat.total &&
                          problem >= 0 && problem < heat.problems);

        if (typeof bonus === 'number') {
          Val.allowIfValid(! top || bonus <= top);
          if (! bonus && top) {
            bonus = top;
          }

          Val.allowIfValid(top < 100 && bonus < 100 &&
                           (top === 0 || top >= bonus) &&
                           (bonus !== 0 || top === 0));

          round[problem] = bonus + top * 100;
        } else {
          round[problem] = bonus === 'dnc' ? -1 : null;
        }

        var b = null, ba = 0, t = 0, ta = 0, score;
        var dnc = null;
        for (var i = 0; i < round.length; ++i) {
          var row = round[i];
          if (row === -1 && dnc === null) {
            dnc = 'dnc';
          } else if (row === 0) {
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

        return Result.query.onId(id).updatePartial(
          'problems', [`${index - 1}.$partial`, ['$replace', round ?? null]],
          'scores', [`${index}.$partial`, [
            '$replace',
            dnc === 'dnc'
              ? -1
              : score = heat.boulderScoreToNumber(b, ba, t, ta, event.ruleVersion) || null]],
        );
      }));
    },
  });

  const addResults = isClient
        ? (ids, doc) => {
          for (const catId of ids) {
            Result.create({
              category_id: catId, event_id: doc.event_id,
              climber_id: doc.climber_id,
              competitor_id: doc._id,
              scores: [Random.fraction()],
            });
          }
        }
        : async (ids, doc) => {
          for (const catId of ids) {
            await Result.create({
              category_id: catId, event_id: doc.event_id,
              climber_id: doc.climber_id,
              competitor_id: doc._id,
              scores: [Random.fraction()],
            });
          }
        };

  const removeResults = isClient
        ? (ids, doc) => {
          for (const catId of ids) {
            Result.query.where({
              climber_id: doc.climber_id, category_id: catId, event_id: doc.event_id}).remove();
          }
        }
        : async (ids, doc) => {
          for (const catId of ids) {
            await Result.query.where({
              climber_id: doc.climber_id, category_id: catId, event_id: doc.event_id}).remove();
          }
        };

  module.onUnload(Result.beforeCreate((doc) => {
    const event = doc.event;
    if (event.heats !== undefined && doc.category_id in event.heats) return;
    return ifPromise(buildHeat(doc, event.heats === undefined),
                     (heats) => Event.query.onId(doc.event_id).updatePartial('heats', heats));
  }));

  module.onUnload(Result.beforeRemove((doc) => ifPromise(
    Result.query.where({event_id: doc.event_id, category_id: doc.category_id})
      .whereNot('_id', doc._id).count(1), (count) => {
        if (count == 0) {
          return Event.query.onId(doc.event_id).updatePartial('heats', [doc.category_id]);
        }
      })));

  const buildHeat = (doc, newHeats) => ifPromise(
    Category.findById(doc.category_id),
    (category) => [doc.category_id, category.type + (category.heatFormat ?? '')],
  );

  module.onUnload(Competitor.beforeCreate((doc) => addResults(doc.category_ids ?? [], doc)));

  module.onUnload(Competitor.beforeUpdate((doc) => {
    const added = util.diff(doc.changes.category_ids ?? [], doc.attributes.category_ids ?? []);
    return ifPromise(addResults(added, doc), () => {
      const removed = util.diff(doc.attributes.category_ids ?? [], doc.changes.category_ids ?? []);
      return removeResults(removed, doc);
    });
  }));

  module.onUnload(Competitor.beforeRemove((doc) => removeResults(doc.category_ids ?? [], doc)));

  Result.eventCatIndex = Result.addUniqueIndex('event_id', 'category_id', 'climber_id');

  require('koru/env!./result')(Result);

  return Result;
});
