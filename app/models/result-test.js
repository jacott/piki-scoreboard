define((require, exports, module) => {
  const Val             = require('koru/model/validation');
  const Random          = require('koru/random').global;
  const util            = require('koru/util');
  const Category        = require('./category');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {error$} = require('koru/symbols');

  const {stub, spy, onEnd, match: m} = TH;

  const Result = require('./result');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let rpc;

    beforeEach(async () => {
      await TH.startTransaction();
      rpc = TH.mockRpc();
    });

    afterEach(() => TH.rollbackTransaction());

    group('setSpeedScore', () => {
      /**
       * Format of speedScore is as follows:
       *
       * [
       *  start_order,
       *  qual,
       *  final,
       *  petitFinal,
       *  semiFinal,
       *  quarterFinal,
       *  roundof16Final,
       * ]
       *
       * * start_order is a random fraction

       * * qual is:
       *    [laneATime, laneBTime, laneAattempt2, laneAattempt3, ...]

       * * final is:
       *    {opponent_id, time, tiebreak: [attempt1, attempt2, ...]}
       * * or for qual re-run
       *    [laneATime, laneBTime, laneAattempt2, laneAattempt3, ...]
       **/
      let category, event, result;
      beforeEach(async () => {
        category = await Factory.createCategory({type: 'S'});
        event = await Factory.createEvent({heats: [category._id]});
        result = await Factory.createResult({scores: [0.123]});
        await TH.login();
        TH.noInfo();
      });

      test('qual re-run', async () => {
        await rpc('Result.setSpeedScore', result._id, {time: 6987, attempt: 2, stage: 1});
        assert.equals(result.$reload().scores, [0.123, , [, 6987]]);
      });

      test('tie', async () => {
        await rpc('Result.setSpeedScore', result._id, {time: 'tie', attempt: 3, stage: 0});
        assert.equals(result.$reload().scores, [0.123, [, , 'tie']]);
      });

      group('authorized', () => {
        test('canJudge with no user', async () => {
          TH.user.restore();
          await assert.accessDenied(() => rpc('Result.setSpeedScore', result._id, {time: 7432, attempt: 1}));
        });

        test('canJudge with closed event', async () => {
          await event.$update('closed', true);
          await assert.accessDenied(() => rpc('Result.setSpeedScore', result._id, {time: 7432, attempt: 1}));
        });
      });

      const assertValidateTime = (validate) => {
        const scores = {};

        const assertValid = (val) => {
          scores[error$] = undefined;
          scores.time = val; validate.call(scores);
          assert.elideFromStack.same(scores[error$], undefined);
        };

        const assertInvalid = (val) => {
          scores[error$] = undefined;
          scores.time = val; validate.call(scores);
          assert.elideFromStack.equals(scores[error$], {time: [['is_invalid']]});
          scores[error$] = undefined;
        };

        assertValid(6*60*1000);
        assertValid(1234);
        assertValid(1);
        assertValid('fall');
        assertValid('fs');
        assertValid('wc');
        assertValid('-');

        assertInvalid(1234.5);
        assertInvalid(6*60*1000 + 1);
        assertInvalid(0);
        assertInvalid(-1);
        assertInvalid('fail');
      };

      test('validation', async () => {
        spy(Val, 'assertCheck');
        const options = {time: 7432, attempt: -1};
        await assert.exception(
          () => rpc('Result.setSpeedScore', result._id, options),
          {error: 400});

        let validateTime, validateOppenent;
        assert.calledWith(Val.assertCheck, m.is(options), m(({$spec}) => {
          assert.equals($spec, {
            time: {type: 'any', validate: m((f) => validateTime = f)},
            attempt: {type: 'number', required: true, number: {integer: true, $gt: 0, $lt: 50}},
            stage: {type: 'number', number: {integer: true, $gte: 0, $lte: 4}},
            opponent_id: {type: 'id'},
          });
          return true;
        }));

        assertValidateTime(validateTime);

        {
          // assertValidateOpponent
          const options = {
            time: 6132, stage: 2, attempt: 1};

          const assertValid = async (val) => {
            options[error$] = undefined;
            options.opponent_id = val;
            await refute.elideFromStack.exception(() => rpc('Result.setSpeedScore', result._id, options));
          };

          const assertInvalid = async (val) => {
            options[error$] = undefined;
            options.opponent_id = val;
            await assert.elideFromStack.exception(
              () => rpc('Result.setSpeedScore', result._id, options),
              {error: 400, reason: 'is_invalid'});
          };

          const r2 = await Factory.createResult();
          await assertValid(r2._id);

          await assertInvalid(undefined);
          await assertInvalid(result._id);
          await assertInvalid(r2._id + 'x');

          await Factory.createCategory();
          r2.attributes.event_id = 'other';
          await assertInvalid(r2._id);
          r2.attributes.event_id = result.event_id;
          r2.attributes.category_id = 'other';
          await assertInvalid(r2._id);
        }
      });

      test('set qualifier time', async () => {
        await rpc('Result.setSpeedScore', result._id, {time: 7432, attempt: 1});
        assert.equals(result.$reload().scores, [0.123, [7432]]);

        await rpc('Result.setSpeedScore', result._id, {time: 6432, attempt: 3});
        assert.equals(result.$reload().scores, [0.123, [7432, , 6432]]);

        await rpc('Result.setSpeedScore', result._id, {time: 'fall', attempt: 2});
        assert.equals(result.$reload().scores, [0.123, [7432, 'fall', 6432]]);

        await rpc('Result.setSpeedScore', result._id, {attempt: 2});
        assert.equals(result.$reload().scores, [0.123, [7432, , 6432]]);
      });

      test('set final score', async () => {
        const result2 = await Factory.createResult();
        await rpc('Result.setSpeedScore', result._id, {
          time: 6132, stage: 3, opponent_id: result2._id, attempt: 1});

        assert.equals(result.$reload().scores, [
          0.123, /*qual*/, /*1*/, /*2*/, {opponent_id: result2._id, time: 6132}]);

        await rpc('Result.setSpeedScore', result._id, {
          time: 7321, stage: 3, opponent_id: result2._id, attempt: 2});

        assert.equals(result.$reload().scores, [
          0.123, /*qual*/, /*1*/, /*2*/, {opponent_id: result2._id, time: 6132, tiebreak: [7321]}]);
      });
    });

    group('Result.setScore', () => {
      let category, event, result;
      beforeEach(async () => {
        category = await Factory.createCategory({heatFormat: 'QQF26F8', type: 'L'});
        event = await Factory.createEvent({heats: [category._id]});
        result = await Factory.createResult({scores: [1]});
        TH.loginAs(await Factory.createUser('admin'));
        TH.noInfo();

        spy(Val, 'ensureString');
        spy(Val, 'ensureNumber');
      });

      test('authorized', async () => {
        const otherOrg = await Factory.createOrg();
        const user = await Factory.createUser();
        TH.loginAs(user);

        await assert.accessDenied(() => rpc('Result.setScore', result._id, 1, '23.5+'));
      });

      test("can't call setBoulderScore", async () => {
        await assert.accessDenied(() => rpc('Result.setBoulderScore', result._id, 1, 2, 3, 4));
      });

      test('index out of range', async () => {
        await assert.accessDenied(() => rpc('Result.setScore', result._id, -1, '23.5+'));

        await assert.accessDenied(() => rpc('Result.setScore', result._id, 5, '23.5+'));
      });

      test('invalid time', async () => {
        await assert.accessDenied(() => rpc('Result.setScore', result._id, 99, '2:63'));
      });

      test('update time', async () => {
        await rpc('Result.setScore', result._id, 99, '2:23');

        assert.calledWith(Val.ensureNumber, 99);
        assert.calledWith(Val.ensureString, result._id, '2:23');

        assert.equals(result.$reload().time, (2*60 + 23));
      });

      test('updates', async () => {
        await rpc('Result.setScore', result._id, 1, '23.5+');

        assert.calledWith(Val.ensureNumber, 1);
        assert.calledWith(Val.ensureString, result._id, '23.5+');

        assert.equals(result.$reload().scores, [1, 235005]);
      });

      test('delete middle score', async () => {
        await result.$update({scores: [1, 220000, 440000]});

        await rpc('Result.setScore', result._id, 1, '  ');

        assert.equals((await result.$reload(true)).scores, [1, undefined, 440000]);
      });

      test('delete last score', async () => {
        await result.$update({scores: [1, 220000, 440000]});

        await rpc('Result.setScore', result._id, 2, '');

        assert.equals(result.$reload().scores, [1, 220000, undefined]);
      });
    });

    group('competitor registration', () => {
      let cat1, cat2, event;
      beforeEach(async () => {
        cat1 = await Factory.createCategory({_id: 'cat1', type: 'L', heatFormat: 'QQF8'});
        cat2 = await Factory.createCategory({_id: 'cat2', type: 'B', heatFormat: 'QQF26F8'});
        event = await Factory.createEvent({heats: undefined});
      });

      test('new category', async () => {
        await (await Factory.buildResult({category_id: cat1._id})).$$save();
        assert.equals(event.$reload().heats, {cat1: 'LQQF8'});

        await (await Factory.buildResult({category_id: cat2._id})).$$save();
        assert.equals(event.$reload().heats, {cat1: 'LQQF8', cat2: 'BQQF26F8'});
      });

      test('no more in category', async () => {
        const r0 = await Factory.buildResult({category_id: cat1._id});
        await r0.$$save();

        const r1 = await Factory.buildResult({category_id: cat1._id});
        await r1.$$save();

        await r0.$remove();
        assert.equals(event.$reload().heats, {cat1: 'LQQF8'});

        await r1.$remove();
        assert.equals(event.$reload().heats, {});
      });
    });

    test('auto create Speed heats', async () => {
      const speed = await Factory.createCategory({type: 'S'});
      const event = await Factory.createEvent({heats: null});
      const result = await Factory.buildResult();
      await result.$$save();

      assert.equals(event.heats[speed._id], 'S');
    });

    group('lead', () => {
      let categories, catIds, competitor;
      beforeEach(async () => {
        categories = await Factory.createList(3, 'createCategory');
        catIds = util.mapField(categories);

        competitor = await Factory.buildCompetitor({category_ids: catIds});
        await competitor.$$save();

        TH.noInfo();

        TH.loginAs(await Factory.createUser('admin'));

        spy(Val, 'ensureString');
        spy(Val, 'ensureNumber');
      });

      test('result has competitor', async () => {
        stub(Random, 'fraction').returns(0.54321);
        const comp2 = await Factory.buildCompetitor({category_ids: catIds});
        await comp2.$$save();
        let res = await Result.where({competitor_id: comp2._id}).fetchOne();
        assert(res);
        assert.equals(res.event_id, competitor.event_id);
        assert.equals(res.scores, [0.54321]);
      });

      group('Result.setBoulderScore', () => {
        let category, event, result;
        beforeEach(async () => {
          category = await Factory.createCategory({heatFormat: 'Q:3F8:2', type: 'B'});
          event = await Factory.createEvent({heats: [category._id]});
          result = await Factory.createResult({scores: [1]});
        });

        test('authorized', async () => {
          const otherOrg = await Factory.createOrg();
          const user = await Factory.createUser();
          TH.loginAs(user);

          await assert.accessDenied(() => rpc('Result.setBoulderScore', result._id, 1, 1, 3, 7));
        });

        test("can't call setScore", async () => {
          await assert.accessDenied(() => rpc('Result.setScore', result._id, 1, '23.5+'));
        });

        test('index out of range', async () => {
          await assert.accessDenied(() => rpc('Result.setBoulderScore', result._id, -1, 1, 2, 3));

          await assert.accessDenied(() => rpc('Result.setBoulderScore', result._id, 1, 4, 4, 5));
        });

        test('bonus > top', async () => {
          await assert.exception(
            () => rpc('Result.setBoulderScore', result._id, 1, 1, 4, 3),
            {error: 400});
        });

        test('top,  bonus range', async () => {
          // top > 0, bonus 0
          await rpc('Result.setBoulderScore', result._id, 1, 1, 0, 3);
          assert.equals(result.$reload().scores, [1, 1019696]);
        });

        test('dnc', async () => {
          await rpc('Result.setBoulderScore', result._id, 1, 2, 'dnc');

          assert.calledWith(Val.ensureNumber, 1, 2);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1, -1]);
          assert.equals(result.problems[0][1], -1);

          await rpc('Result.setBoulderScore', result._id, 1, 1, 0, 0);

          assert.equals(result.$reload().scores, [1, 9999]);
          assert.equals(result.problems[0], [0, -1]);
        });

        test('clear middle', async () => {
          await result.$update({scores: [1, 2, 3, 4], problems: [[2, 1], [4], [7, 8]]});
          await rpc('Result.setBoulderScore', result._id, 2, 1);
          assert.equals((await result.$reload(true)).scores, [1, 2, , 4]);
          assert.equals(result.problems, [[2, 1], [null], [7, 8]]);
        });

        test('clear', async () => {
          await rpc('Result.setBoulderScore', result._id, 1, 2);

          assert.calledWith(Val.ensureNumber, 1, 2);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1]);
          assert.equals(result.problems[0], [, null]);

          await rpc('Result.setBoulderScore', result._id, 1, 1);

          assert.equals(result.$reload().scores, [1]);
          assert.equals(result.problems[0], [null, null]);
        });

        test('update attempts', async () => {
          await rpc('Result.setBoulderScore', result._id, 1, 2, 3, 4);

          assert.calledWith(Val.ensureNumber, 1, 2, 3, 4);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1, 1019596]);
          assert.equals(result.problems[0][1], 403);

          await rpc('Result.setBoulderScore', result._id, 1, 1, 1, 1);
          assert.equals(result.$reload().scores, [1, 2029495]);
          assert.equals(result.problems[0], [101, 403]);

          await rpc('Result.setBoulderScore', result._id, 1, 2, 5, 0);
          assert.equals(result.$reload().scores, [1, 1029893]);
          assert.equals(result.problems[0], [101, 5]);
        });

        test('other ruleVersion, update attempts', async () => {
          event.ruleVersion = 0;
          await rpc('Result.setBoulderScore', result._id, 1, 2, 3, 4);

          assert.calledWith(Val.ensureNumber, 1, 2, 3, 4);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1, 1950196]);
          assert.equals(result.problems[0][1], 403);

          await rpc('Result.setBoulderScore', result._id, 1, 1, 1, 1);
          assert.equals(result.$reload().scores, [1, 2940295]);
          assert.equals(result.problems[0], [101, 403]);

          await rpc('Result.setBoulderScore', result._id, 1, 2, 5, 0);
          assert.equals(result.$reload().scores, [1, 1980293]);
          assert.equals(result.problems[0], [101, 5]);
        });
      });

      test('displayTimeTaken', async () => {
        const result = await Factory.buildResult();

        assert.same(result.displayTimeTaken(), '');

        result.time = 5*60 + 59;
        assert.same(result.displayTimeTaken(), '5:59');

        result.time = 69;
        assert.same(result.displayTimeTaken(), '1:09');
      });

      test('unscoredHeat', async () => {
        const category = await Factory.createCategory({heatFormat: 'QQF26F8'});
        const event = await Factory.createEvent({heats: [category._id]});
        const result = await Factory.createResult();

        assert.same(result.unscoredHeat(), 1);

        result.scores.push(123);
        result.scores.push(223);
        assert.same(result.unscoredHeat(), 3);
      });

      test('associated', async () => {
        const result = await Factory.createResult();

        assert(result.climber);
        assert(result.category);
        assert(result.event);
      });

      test('created when competitor registered', async () => {
        const cat1Comp = await Factory.buildCompetitor({category_ids: catIds});
        await cat1Comp.$$save();
        const r2 = await Result.query.where({category_id: categories[0]._id}).fetchOne();
        assert(r2);
        const results = await Result.query.where({category_id: categories[1]._id}).fetch();
        assert.same(results.length, 2);
        const result = results[0];

        assert.same(result.event_id, competitor.event_id);
        assert.same(result.climber_id, competitor.climber_id);
        assert.between(result.scores[0], 0, 1);
        refute.same(r2.scores[0], result.scores[0]);
      });

      test('deleted when competitor cat removed', async () => {
        competitor.category_ids = catIds.slice(1);
        await competitor.$$save();

        assert.same(await Result.query.where('category_id', categories[0]._id).count(), 0);
        assert.same(await Result.query.where('category_id', categories[1]._id).count(), 1);
        assert.same(await Result.query.where('category_id', categories[2]._id).count(), 1);
      });

      test('all deleted when competitor deregistered', async () => {
        const climber = await Factory.createClimber();
        const comp2 = await Factory.buildCompetitor({
          event_id: competitor.event_id, category_id: competitor.category_id});
        await comp2.$$save();

        await competitor.$remove();

        assert.same(await Result.query.count(), 1);
      });
    });
  });
});
