define((require, exports, module)=>{
  const Val             = require('koru/model/validation');
  const Random          = require('koru/random').global;
  const util            = require('koru/util');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');
  const Category        = require('./category');

  const {error$} = require('koru/symbols');

  const {stub, spy, onEnd, match: m} = TH;

  const Result = require('./result');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let rpc;

    beforeEach(()=>{
      rpc = TH.mockRpc();
    });

    afterEach(()=>{
      TH.clearDB();
    });

    group("setSpeedScore", ()=>{
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
      beforeEach(()=>{
        category = Factory.createCategory({type: 'S'});
        event = Factory.createEvent({heats: [category._id]});
        result = Factory.createResult({scores: [0.123]});
        TH.login();
        TH.noInfo();
      });

      test("qual re-run", ()=>{
        rpc("Result.setSpeedScore", result._id, {time: 6987, attempt: 2, stage: 1});
        assert.equals(result.$reload().scores, [0.123, , [, 6987]]);
      });

      test("tie", ()=>{
        rpc("Result.setSpeedScore", result._id, {time: 'tie', attempt: 3, stage: 0});
        assert.equals(result.$reload().scores, [0.123, [, , 'tie']]);
      });

      group("authorized", ()=>{
        test("canJudge with no user", ()=>{
          TH.user.restore();
          assert.accessDenied(()=>{
            rpc("Result.setSpeedScore", result._id, {time: 7432, attempt: 1});
          });
        });

        test("canJudge with closed event", ()=>{
          event.$update('closed', true);
          assert.accessDenied(()=>{
            rpc("Result.setSpeedScore", result._id, {time: 7432, attempt: 1});
          });
        });
      });

      const assertValidateTime = (validate)=>{
        const scores = {};

        const assertValid = (val)=>{
          scores[error$] = undefined;
          scores.time = val; validate.call(scores);
          assert.elideFromStack.same(scores[error$], undefined);
        };

        const assertInvalid = (val)=>{
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
        assertInvalid(6*60*1000+1);
        assertInvalid(0);
        assertInvalid(-1);
        assertInvalid('fail');
      };

      test("validation", ()=>{
        spy(Val, 'assertCheck');
        const options = {time: 7432, attempt: -1};
        assert.exception(()=>{
          rpc("Result.setSpeedScore", result._id, options);
        }, {error: 400});
        let validateTime, validateOppenent;
        assert.calledWith(Val.assertCheck, m.is(options), m(({$spec})=>{
          assert.equals($spec, {
            time: {type: 'any', validate: m(f => validateTime = f)},
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

          const assertValid = (val)=>{
            options[error$] = undefined;
            options.opponent_id = val;
            refute.elideFromStack.exception(()=>{
              rpc("Result.setSpeedScore", result._id, options);
            });
          };

          const assertInvalid = (val)=>{
            options[error$] = undefined;
            options.opponent_id = val;
            assert.elideFromStack.exception(()=>{
              rpc("Result.setSpeedScore", result._id, options);
            }, {error: 400, reason: 'is_invalid'});
          };

          const r2 = Factory.createResult();
          assertValid(r2._id);

          assertInvalid(undefined);
          assertInvalid(result._id);
          assertInvalid(r2._id+'x');

          Factory.createCategory();
          r2.attributes.event_id = 'other';
          assertInvalid(r2._id);
          r2.attributes.event_id = result.event_id;
          r2.attributes.category_id = 'other';
          assertInvalid(r2._id);
        }
      });

      test("set qualifier time", ()=>{
        rpc("Result.setSpeedScore", result._id, {time: 7432, attempt: 1});
        assert.equals(result.$reload().scores, [0.123, [7432]]);

        rpc("Result.setSpeedScore", result._id, {time: 6432, attempt: 3});
        assert.equals(result.$reload().scores, [0.123, [7432, , 6432]]);

        rpc("Result.setSpeedScore", result._id, {time: 'fall', attempt: 2});
        assert.equals(result.$reload().scores, [0.123, [7432, 'fall', 6432]]);

        rpc("Result.setSpeedScore", result._id, {attempt: 2});
        assert.equals(result.$reload().scores, [0.123, [7432, , 6432]]);
      });

      test("set final score", ()=>{
        const result2 = Factory.createResult();
        rpc("Result.setSpeedScore", result._id, {
          time: 6132, stage: 3, opponent_id: result2._id, attempt: 1});

        assert.equals(result.$reload().scores, [
          0.123, /*qual*/, /*1*/, /*2*/, {opponent_id: result2._id, time: 6132}]);

        rpc("Result.setSpeedScore", result._id, {
          time: 7321, stage: 3, opponent_id: result2._id, attempt: 2});

        assert.equals(result.$reload().scores, [
          0.123, /*qual*/, /*1*/, /*2*/, {opponent_id: result2._id, time: 6132, tiebreak: [7321]}]);
      });
    });

    group("Result.setScore", ()=>{
      let category, event, result;
      beforeEach(()=>{
        category = Factory.createCategory({heatFormat: "QQF26F8", type: 'L'});
        event = Factory.createEvent({heats: [category._id]});
        result = Factory.createResult({scores: [1]});
        TH.loginAs(Factory.createUser('admin'));
        TH.noInfo();

        spy(Val, 'ensureString');
        spy(Val, 'ensureNumber');
      });

      test("authorized", ()=>{
        const otherOrg = Factory.createOrg();
        const user = Factory.createUser();
        TH.loginAs(user);

        assert.accessDenied(function () {
          rpc("Result.setScore", result._id, 1, '23.5+');
        });
      });

      test("can't call setBoulderScore", ()=>{
        assert.accessDenied(function () {
          rpc("Result.setBoulderScore", result._id, 1, 2, 3, 4);
        });
      });

      test("index out of range", ()=>{
        assert.accessDenied(function () {
          rpc("Result.setScore", result._id, -1, '23.5+');
        });

        assert.accessDenied(function () {
          rpc("Result.setScore", result._id, 5, '23.5+');
        });
      });

      test("invalid time", ()=>{
        assert.accessDenied(function () {
          rpc("Result.setScore", result._id, 99, '2:63');
        });
      });

      test("update time", ()=>{
        rpc("Result.setScore", result._id, 99, '2:23');

        assert.calledWith(Val.ensureNumber, 99);
        assert.calledWith(Val.ensureString, result._id, '2:23');

        assert.equals(result.$reload().time, (2*60+23));
      });

      test("updates", ()=>{
        rpc("Result.setScore", result._id, 1, '23.5+');

        assert.calledWith(Val.ensureNumber, 1);
        assert.calledWith(Val.ensureString, result._id, '23.5+');

        assert.equals(result.$reload().scores, [1, 235005]);
      });

      test("delete middle score", ()=>{
        result.$update({scores: [1, 220000, 440000]});

        rpc("Result.setScore", result._id, 1, '  ');

        assert.equals(result.$reload(true).scores, [1, undefined, 440000]);
      });

      test("delete last score", ()=>{
        result.$update({scores: [1, 220000, 440000]});

        rpc("Result.setScore", result._id, 2, '');

        assert.equals(result.$reload().scores, [1, 220000, undefined]);
      });
    });

    group("competitor registration", ()=>{
      let cat1, cat2, event;
      beforeEach(()=>{
        cat1 = Factory.createCategory({_id: 'cat1', type: 'L', heatFormat: 'QQF8'});
        cat2 = Factory.createCategory({_id: 'cat2', type: 'B', heatFormat: 'QQF26F8'});
        event = Factory.createEvent({heats: undefined});
      });

      test("new category", ()=>{
        Factory.buildResult({category_id: cat1._id}).$$save();
        assert.equals(event.$reload().heats, {cat1: 'LQQF8'});

        Factory.buildResult({category_id: cat2._id}).$$save();
        assert.equals(event.$reload().heats, {cat1: 'LQQF8', cat2: 'BQQF26F8'});
      });

      test("no more in category", ()=>{
        const results = [1,2].map(()=>{
          const result = Factory.buildResult({category_id: cat1._id});
          result.$$save();
          return result;
        });

        results[0].$remove();
        assert.equals(event.$reload().heats, {cat1: 'LQQF8'});

        results[1].$remove();
        assert.equals(event.$reload().heats, {});
      });
    });

    test("auto create Speed heats", ()=>{
      const speed = Factory.createCategory({type: 'S'});
      const event = Factory.createEvent({heats: null});
      const result = Factory.buildResult();
      result.$$save();

      assert.equals(event.heats[speed._id], 'S');
    });

    group("lead", ()=>{
      let categories, catIds, competitor;
      beforeEach(()=>{
        categories = Factory.createList(3, 'createCategory');
        catIds = util.mapField(categories);

        competitor = Factory.buildCompetitor({category_ids: catIds});
        competitor.$$save();

        TH.noInfo();

        TH.loginAs(Factory.createUser('admin'));

        spy(Val, 'ensureString');
        spy(Val, 'ensureNumber');
      });

      test("result has competitor", ()=>{
        stub(Random, 'fraction').returns(0.54321);
        const comp2 = Factory.buildCompetitor({category_ids: catIds});
        comp2.$$save();
        let res = Result.where({competitor_id: comp2._id}).fetchOne();
        assert(res);
        assert.equals(res.event_id, competitor.event_id);
        assert.equals(res.scores, [0.54321]);
      });

      group("Result.setBoulderScore", ()=>{
        let category, event, result;
        beforeEach(()=>{
          category = Factory.createCategory({heatFormat: "Q:3F8:2", type: 'B'});
          event = Factory.createEvent({heats: [category._id]});
          result = Factory.createResult({scores: [1]});
        });

        test("authorized", ()=>{
          const otherOrg = Factory.createOrg();
          const user = Factory.createUser();
          TH.loginAs(user);

          assert.accessDenied(function () {
            rpc("Result.setBoulderScore", result._id, 1, 1, 3, 7);
          });
        });

        test("can't call setScore", ()=>{
          assert.accessDenied(function () {
            rpc("Result.setScore", result._id, 1, '23.5+');
          });
        });

        test("index out of range", ()=>{
          assert.accessDenied(function () {
            rpc("Result.setBoulderScore", result._id, -1, 1, 2, 3);
          });

          assert.accessDenied(function () {
            rpc("Result.setBoulderScore", result._id, 1, 4, 4, 5);
          });
        });

        test("bonus > top", ()=>{
          assert.exception(()=>{
            rpc("Result.setBoulderScore", result._id, 1, 1, 4, 3);
          }, {error: 400});
        });

        test("top,  bonus range", ()=>{
          // top > 0, bonus 0
          rpc("Result.setBoulderScore", result._id, 1, 1, 0, 3);
          assert.equals(result.$reload().scores, [1, 1019696]);
        });

        test("dnc", ()=>{
          rpc("Result.setBoulderScore", result._id, 1, 2, "dnc");

          assert.calledWith(Val.ensureNumber, 1, 2);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1, -1]);
          assert.equals(result.problems[0][1], -1);

          rpc("Result.setBoulderScore", result._id, 1, 1, 0, 0);

          assert.equals(result.$reload().scores, [1, 9999]);
          assert.equals(result.problems[0], [0, -1]);
        });

        test("clear middle", ()=>{
          result.$update({scores: [1, 2, 3, 4], problems: [[2,1],[4],[7,8]]});
          rpc("Result.setBoulderScore", result._id, 2, 1);
          assert.equals(result.$reload(true).scores, [1, 2, , 4]);
          assert.equals(result.problems, [[2, 1], [null], [7, 8]]);
        });

        test("clear", ()=>{
          rpc("Result.setBoulderScore", result._id, 1, 2);

          assert.calledWith(Val.ensureNumber, 1, 2);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1]);
          assert.equals(result.problems[0], [,null]);

          rpc("Result.setBoulderScore", result._id, 1, 1);

          assert.equals(result.$reload().scores, [1]);
          assert.equals(result.problems[0], [null, null]);
        });

        test("update attempts", ()=>{
          rpc("Result.setBoulderScore", result._id, 1, 2, 3, 4);

          assert.calledWith(Val.ensureNumber, 1, 2, 3, 4);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1, 1019596]);
          assert.equals(result.problems[0][1], 403);

          rpc("Result.setBoulderScore", result._id, 1, 1, 1, 1);
          assert.equals(result.$reload().scores, [1, 2029495]);
          assert.equals(result.problems[0], [101, 403]);

          rpc("Result.setBoulderScore", result._id, 1, 2, 5, 0);
          assert.equals(result.$reload().scores, [1, 1029893]);
          assert.equals(result.problems[0], [101, 5]);
        });

        test("other ruleVersion, update attempts", ()=>{
          event.ruleVersion = 0;
          rpc("Result.setBoulderScore", result._id, 1, 2, 3, 4);

          assert.calledWith(Val.ensureNumber, 1, 2, 3, 4);
          assert.calledWith(Val.ensureString, result._id);

          assert.equals(result.$reload().scores, [1, 1950196]);
          assert.equals(result.problems[0][1], 403);

          rpc("Result.setBoulderScore", result._id, 1, 1, 1, 1);
          assert.equals(result.$reload().scores, [1, 2940295]);
          assert.equals(result.problems[0], [101, 403]);

          rpc("Result.setBoulderScore", result._id, 1, 2, 5, 0);
          assert.equals(result.$reload().scores, [1, 1980293]);
          assert.equals(result.problems[0], [101, 5]);
        });
      });

      test("displayTimeTaken", ()=>{
        const result = Factory.buildResult();

        assert.same(result.displayTimeTaken(), "");

        result.time = 5*60 + 59;
        assert.same(result.displayTimeTaken(), "5:59");

        result.time = 69;
        assert.same(result.displayTimeTaken(), "1:09");

      });

      test("unscoredHeat", ()=>{
        const category = Factory.createCategory({heatFormat: "QQF26F8"});
        const event = Factory.createEvent({heats: [category._id]});
        const result = Factory.createResult();

        assert.same(result.unscoredHeat(), 1);

        result.scores.push(123);
        result.scores.push(223);
        assert.same(result.unscoredHeat(), 3);
      });

      test("associated", ()=>{
        const result = Factory.createResult();

        assert(result.climber);
        assert(result.category);
        assert(result.event);
      });

      test("created when competitor registered", ()=>{
        const cat1Comp = Factory.buildCompetitor({category_ids: catIds});
        cat1Comp.$$save();
        const r2 = Result.query.where({category_id: categories[0]._id}).fetchOne();
        assert(r2);
        const results = Result.query.where({category_id: categories[1]._id}).fetch();
        assert.same(results.length, 2);
        const result = results[0];

        assert.same(result.event_id, competitor.event_id);
        assert.same(result.climber_id, competitor.climber_id);
        assert.between(result.scores[0], 0, 1);
        refute.same(r2.scores[0], result.scores[0]);
      });

      test("deleted when competitor cat removed", ()=>{
        competitor.category_ids = catIds.slice(1);
        competitor.$$save();

        assert.same(Result.query.where('category_id', categories[0]._id).count(), 0);
        assert.same(Result.query.where('category_id', categories[1]._id).count(), 1);
        assert.same(Result.query.where('category_id', categories[2]._id).count(), 1);
      });

      test("all deleted when competitor deregistered", ()=>{
        const climber = Factory.createClimber();
        const comp2 = Factory.buildCompetitor({
          event_id: competitor.event_id, category_id: competitor.category_id});
        comp2.$$save();


        competitor.$remove();

        assert.same(Result.query.count(), 1);
      });
    });
  });
});
