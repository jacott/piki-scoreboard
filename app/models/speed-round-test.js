define((require, exports, module)=>{
  const Enumerable      = require('koru/enumerable');
  const Result          = require('models/result');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {private$} = require('koru/symbols');

  const {stub, spy, onEnd, util} = TH;

  const SpeedRound = require('./speed-round');

  const {laneA, laneB, ranking} = SpeedRound;

  const private = SpeedRound[private$];

  const {hasTies, missingScore, timeVsFS} = SpeedRound.ERROR;

  const createResults = (ans, opts)=>{
    for (const id in opts) {
      Factory.createClimber({name: 'climber_'+id});
      ans[id] = Factory.createResult({_id: id, scores: opts[id]});
    }
  };

  const toResId = (round)=> Array.from(round).map(r => +r._id.slice(1));
  const toRanking = (round)=> Array.from(round).map(r => ranking(r));

  const serverUpdScores = isServer ? (...args)=>{
    for (const res of args) res.$update('scores', res.scores);
  } : ()=>{};

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("onChange", ()=>{
      const onChange = stub().returns('handle');
      const round = new SpeedRound({stage: 0, query: {onChange}});

      const observer = ()=>{};
      assert.same(round.onChange(observer), 'handle');
      assert.calledWith(onChange, observer);
    });

    group("attempts", ()=>{
      test("quals", ()=>{
        const res = {scores: [0.31, [6001, 7000, 'fall', 8765, 1234]]};
        const qual = new SpeedRound({stage: 0, previous: 0});

        assert.equals(Array.from(qual.attempts(res)), ['fall', 8765, 1234]);

        const final = new SpeedRound({stage: 1, previous: 0});

        assert.equals(Array.from(final.attempts(res)), []);

        res.scores[2] = {time: 6555, tiebreak: [6655, 6644, 6633]};

        assert.equals(Array.from(final.attempts(res)), [6655, 6644, 6633]);
      });
    });

    group("complete", ()=>{
      test("missing times", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r01: [0.31, [6000, 7000], , {time: 8655, opponent_id: 'r02'}],
          r02: [0.21, [6000, 7000], , {time: 'fs', opponent_id: 'r01'}],
          r03: [0.41, [6000, 7000], , {time: 6655, opponent_id: 'r04'}],
          r04: [0.51, [6000, 7000], , {time: null, opponent_id: 'r03'}],
        });

        const round = new SpeedRound({
          stage: 2, previous: 0, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.equals(round.complete(), {
          error: 'All scores must be entered.',
          nextStage: 2});
      });

      test("checkValid", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r01: [0.31, [6000, 7000], , {time: 8655, opponent_id: 'r02'}],
          r02: [0.21, [6000, 7000], , {time: 'fs', opponent_id: 'r01'}],
          r03: [0.41, [6000, 7000], , {time: 6655, opponent_id: 'r04'}],
          r04: [0.51, [6000, 7000], , {time: 5655, opponent_id: 'r03'}],
        });

        const round = new SpeedRound({
          stage: 2, previous: 0, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.equals(round.complete(), {
          error: 'Invalid score combination: time/fall vs false start. Enter "wc" (wildcard) instead of time/fall.',
          nextStage: 2});

        res.r01.scores[3].time = 'fall';

        assert.equals(round.complete(), {
          error: timeVsFS,
          nextStage: 2});

        res.r01.scores[3].time = null;

        assert.equals(round.complete(), {
          error: missingScore,
          nextStage: 2});

        res.r01.scores[3].time = '-';

        assert.equals(round.complete(), {
          error: hasTies,
          nextStage: 2});

        res.r01.scores[3].time = 'fs';
        res.r02.scores[3].time = 6789;

        assert.equals(round.complete(), {
          error: timeVsFS,
          nextStage: 2});

        res.r02.scores[3].time = 'fall';

        assert.equals(round.complete(), {
          error: timeVsFS,
          nextStage: 2});

        res.r02.scores[3].time = null;

        assert.equals(round.complete(), {
          error: missingScore,
          nextStage: 2});

        res.r02.scores[3] = null;

        assert.equals(round.complete(), {
          error: missingScore,
          nextStage: 2});
      });

      test("quals", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r1: [0.31, [6001, 7000]],
          r2: [0.21, [6102, 7000]],
          r3: [0.41, [6500, 7000]],
          r4: [0.61, [7000, 6500]],
          r5: [0.2, [6500, 7000]],
          r6: [0.3, [6500, 7000]],
        });

        const round = new SpeedRound({
          stage: 0, previous: 0, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.equals(round.complete(), {
          error: 'Break ties by further attempts on Lane A.', nextStage: 0});

        assert.equals(Array.from(round.query).map(r => r.scores[1]), [
          [6001, 7000], [6102, 7000],
          [6500, 7000, 'tie'], [7000, 6500, 'tie'],
          [6500, 7000, 'tie'], [6500, 7000, 'tie']]);

        for(let i = 3; i <= 6 ; ++i) {
          res['r'+i].scores[1][2] = 6754;
        }

        assert.equals(round.complete(), {error: hasTies, nextStage: 0});

        assert.equals(Array.from(round.query).map(r => r.scores[1]), [
          [6001, 7000], [6102, 7000],
          [6500, 7000, 6754, 'tie'], [7000, 6500, 6754, 'tie'],
          [6500, 7000, 6754, 'tie'], [6500, 7000, 6754, 'tie']]);

        for(let i = 3; i <= 6 ; ++i) {
          res['r'+i].scores[1][3] = 6744-i;
        }

        assert.equals(round.complete(), {error: '', nextStage: 2});
      });

      test("semi final", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r01: [0.31, [6000, 7000], , {time: 6655, opponent_id: 'r02'}],
          r02: [0.21, [6000, 7000], , {time: 6655, opponent_id: 'r01'}],
          r03: [0.41, [6000, 7000], , {time: 6655, opponent_id: 'r04'}],
          r04: [0.51, [6000, 7000], , {time: 6655, opponent_id: 'r03'}],
        });

        const round = new SpeedRound({
          stage: 2, previous: 0, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.equals(round.complete(), {error: hasTies, nextStage: 2});

        assert.equals(Array.from(round.query).map(r => r.scores[3]), [
          {time: 6655, opponent_id: 'r02', tiebreak: ['tie']},
          {time: 6655, opponent_id: 'r01', tiebreak: ['tie']},
          {time: 6655, opponent_id: 'r04', tiebreak: ['tie']},
          {time: 6655, opponent_id: 'r03', tiebreak: ['tie']}]);

        for(let i = 1; i <= 4 ; ++i) res['r0'+i].scores[3].tiebreak[0] = 6754;


        assert.equals(round.complete(), {error: hasTies, nextStage: 2});

        assert.equals(Array.from(round.query).map(r => r.scores[3]), [
          {time: 6655, opponent_id: 'r02', tiebreak: [6754, 'tie']},
          {time: 6655, opponent_id: 'r01', tiebreak: [6754, 'tie']},
          {time: 6655, opponent_id: 'r04', tiebreak: [6754, 'tie']},
          {time: 6655, opponent_id: 'r03', tiebreak: [6754, 'tie']}]);

        for(let i = 1; i <= 4 ; ++i) res['r0'+i].scores[3].tiebreak[1] = i % 2 == 0 ? 6800 : 6900;

        assert.equals(round.complete(), {error: '', nextStage: 1});
      });

      test("semi final with qual ties", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r01: [0.31, [6000, 7000, 6000], , {time: 6655, opponent_id: 'r02'}],
          r02: [0.21, [6000, 7000, 7100], , {time: 6655, opponent_id: 'r01'}],
          r03: [0.41, [6000, 7000, 6000], , {time: 6655, opponent_id: 'r04'}],
          r04: [0.51, [6000, 7000, 7200], , {time: 6655, opponent_id: 'r03'}],

          r05: [0.61, [6000, 7000, 7400]],
        });

        const round = new SpeedRound({
          stage: 2, previous: 0, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.equals(round.complete(), {error: hasTies, nextStage: 2});

        assert.equals(Array.from(round.query).map(r => r.scores[3]), [
          {time: 6655, opponent_id: 'r02', tiebreak: ['tie']},
          {time: 6655, opponent_id: 'r01', tiebreak: ['tie']},
          {time: 6655, opponent_id: 'r04', tiebreak: ['tie']},
          {time: 6655, opponent_id: 'r03', tiebreak: ['tie']},
          void 0]);

        for(let i = 1; i <= 4 ; ++i) res['r0'+i].scores[3].tiebreak[0] = i % 2 == 0 ? 6800 : 6900;

        assert.equals(round.complete(), {error: '', nextStage: 1});

        const gen = new SpeedRound({
          stage: -1, previous: 4, query: Enumerable.propertyValues(res)});

        gen.rankResults();

        assert.equals(toRanking(gen), [1, 1, 3, 3, 5]);
        assert.equals(toResId(gen), [4, 2, 3, 1, 5]);
      });

      test("final", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r01: [0.31, [6000, 7000], {time: 6555, opponent_id: 'r04'}, {time: 6655, opponent_id: 'r02'}],
          r02: [0.21, [6000, 7000], {time: 6555, opponent_id: 'r03'}, {time: 6555, opponent_id: 'r01'}],
          r03: [0.41, [6000, 7000], {time: 6555, opponent_id: 'r02'}, {time: 6555, opponent_id: 'r04'}],
          r04: [0.51, [6000, 7000], {time: 6555, opponent_id: 'r01'}, {time: 6655, opponent_id: 'r03'}],
        });

        const round = new SpeedRound({
          stage: 1, previous: 2, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.equals(round.complete(), {error: hasTies, nextStage: 1});

        assert.equals(Array.from(round.query).map(r => r.scores[2]), [
          {time: 6555, opponent_id: 'r04', tiebreak: ['tie']},
          {time: 6555, opponent_id: 'r03', tiebreak: ['tie']},
          {time: 6555, opponent_id: 'r02', tiebreak: ['tie']},
          {time: 6555, opponent_id: 'r01', tiebreak: ['tie']}]);

        for(let i = 1; i <= 4 ; ++i) res['r0'+i].scores[2].tiebreak[0] = 6754;

        assert.equals(round.complete(), {error: hasTies, nextStage: 1});

        assert.equals(Array.from(round.query).map(r => r.scores[2]), [
          {time: 6555, opponent_id: 'r04', tiebreak: [6754, 'tie']},
          {time: 6555, opponent_id: 'r03', tiebreak: [6754, 'tie']},
          {time: 6555, opponent_id: 'r02', tiebreak: [6754, 'tie']},
          {time: 6555, opponent_id: 'r01', tiebreak: [6754, 'tie']}]);

        for(let i = 1; i <= 4 ; ++i) res['r0'+i].scores[2].tiebreak[1] = i % 2 == 0 ? 6800 : 6900;

        assert.equals(round.complete(), {error: '', nextStage: -3});
      });
    });

    group("quals", ()=>{
      test("qual ranking", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r1: [0.31, [6001, 7000]],
          r2: [0.21, [6001, 7000]],
          r3: [0.41, [6001, 7000]],
          r4: [0.61, ['fs', 'fs']],
          r5: [0.20, [6501, 'fs']],
          r6: [0.30, ['fall', 'fall']],
          r7: [0.90, ['fs', 5234]],

        });

        const round = new SpeedRound({
          stage: 0, query: Enumerable.propertyValues(res)});

        round.rankResults();

        assert.equals(toRanking(round), [1, 1, 1, 4, 4, 4, 4]);
        assert.equals(toResId(round), [3, 1, 2, 5, 4, 6, 7]);
      });

      test("calcStartList", ()=>{
        let r1, r2, r3, r4, r5;
        const results = [
          r1 = {scores: [0.21]}, r2 = {scores: [0.42]},
          r3 = {scores: [0.33]}, r4 = {scores: [0.14]},
        ];
        const round = new SpeedRound({stage: 0, query: results});

        round.calcStartList();
        assert.equals(round.entries.compare.compareKeys, ['scores', '_id']);

        assert.same(laneA(r1), r2);
        assert.same(laneB(r1), r2);
        assert.same(laneA(r2), r1);
        assert.same(laneB(r2), r1);

        assert.equals(Array.from(round), [r4, r1, r3, r2]);

        r5 = {scores: [0.18]};
        round.entries.add(r5);
        round.recalcQualsStartList();

        assert.same(laneA(r1), r2);
        assert.same(laneB(r1), r4);
        assert.same(laneA(r3), r4);
        assert.same(laneB(r3), r5);

        assert.equals(Array.from(round), [r4, r5, r1, r3, r2]);

        round.entries.delete(r3);
        round.recalcQualsStartList();

        assert.same(laneA(r1), r4);
        assert.same(laneB(r1), r4);
        assert.same(laneA(r5), r2);
        assert.same(laneA(r2), r5);

        assert.equals(Array.from(round), [r4, r5, r1, r2]);
      });

      test("private.compareQualStartOrder", ()=>{
        let r1, r2, r3, r4;
        const round = new SpeedRound({stage: 0});
        const results = [
          r1 = {scores: [0.21]}, r2 = {scores: [0.42]},
          r3 = {scores: [0.33]}, r4 = {scores: [0.14]}];

        const compare = private.compareQualStartOrder;
        assert.equals(compare.compareKeys, ['scores', '_id']);

        let ans = results.sort(compare);

        assert.equals(ans, [r4, r1, r3, r2]);
      });

      test("isTimeValid", ()=>{
        const round = new SpeedRound({stage: 0});
        assert.isTrue(round.isTimeValid({scores: [0.4, [6532, 'fall', 10144]]}));
        assert.isTrue(round.isTimeValid({scores: [0.4, [6532, 1234]]}));
        assert.isFalse(round.isTimeValid({scores: [0.4, [undefined, 'fall']]}));
        assert.isFalse(round.isTimeValid({scores: [0.4, ['fall']]}));
        assert.isFalse(round.isTimeValid({scores: [0.4, ['fall', 'fall']]}));
        assert.isFalse(round.isTimeValid({scores: [0.4, ['fs', 123]]}));
        assert.isFalse(round.isTimeValid({scores: [0.4]}));
      });

      test("hasClimbed", ()=>{
        const round = new SpeedRound({stage: 0});
        assert.isFalse(round.hasClimbed({scores: [0.4]}));
        assert.isFalse(round.hasClimbed({scores: [0.4, [null, null]]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, [6532, 1234]]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, [undefined, 'fall']]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, ['fall']]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, ['fs']]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, [6532, 'fall', 10144]]}));
      });

      test("checkValid missingScore", ()=>{
        const round = new SpeedRound({stage: 0});

        assert.same(round.checkValid({scores: [0.4, [1234, 5678]]}), '');
        assert.same(round.checkValid({scores: [0.4, ['fall', 5678]]}), '');
        assert.same(round.checkValid({scores: [0.4, ['fall', null]]}), missingScore);
        assert.same(round.checkValid({scores: [0.4]}), missingScore);
        assert.same(round.checkValid({scores: [0.4, ['fs']]}), missingScore);
        assert.same(round.checkValid({scores: [0.4, [1234]]}), missingScore);
      });

      test("getTime", ()=>{
        const round = new SpeedRound({stage: 0});

        assert.same(round.getTime({scores: [0.4, [1234, 5678]]}, 0), 1234);
        assert.same(round.getTime({scores: [0.4, [1234, 5678]]}, 1), 5678);
        assert.same(round.getTime({scores: [0.4, [1234, 'fall']]}, 1), 'fall');
      });

      test("setTime", ()=>{
        const round = new SpeedRound({stage: 0});

        let opts;
        const setSpeedScore = v =>{opts = v};

        round.setTime({setSpeedScore}, {time: 123, lane: 0});
        assert.equals(opts, {time: 123, attempt: 1});

        round.setTime({setSpeedScore}, {time: 'fs', lane: 1});
        assert.equals(opts, {time: 'fs', attempt: 2});

        round.setTime({setSpeedScore}, {time: 'dnc', lane: 1});
        assert.equals(opts, {time: '-', attempt: 2});

        round.setTime({setSpeedScore}, {time: '-', lane: 1});
        assert.equals(opts, {time: '-', attempt: 2});
      });

      group("rankResults", ()=>{
        test("quals tiebreak", ()=>{
          const results = [
            {scores: [0.221, [5000, 7000]]},
            {scores: [0.421, [5000, 7000]]},
            {scores: [0.33, [7000, 7800]]}, // 3
            {scores: [0.14, [7000, 8000, 4000]]},

            {scores: [0.34, [7000, 8000, 4001]]}, // 5
            {scores: [0.94, [7000, 8000, 10000]]},
            {scores: [0.21, [7000, 9000]]},
            {scores: [0.11, ['fs']]},

            {scores: [0.13, ['fs']]}, // 9
            {scores: [0.312, ['fs']]}
          ];

          const round = new SpeedRound({stage: 0, query: results.slice()});

          const map = new Map(results.map((o, i) => [o, i+1]));

          round.rankResults();
          assert.equals(round.entries.compare.compareKeys, [private.ranking$, private.random$, '_id']);

          assert.equals(
            Array.from(round).map(o => map.get(o)),
            [2, 1, 3, 4, 6, 5, 7, 10, 8, 9]);

          assert.equals(
            Array.from(round).map(o => ranking(o)),
            [1, 1, 3, 4, 5, 5, 7, 8, 8, 8]);

          assert.equals(
            Array.from(round).map(o => map.get(o)),
            [2, 1, 3, 4, 6, 5, 7, 10, 8, 9]);
        });

        test("random ties before cutoff", ()=>{
          const results = [
            {scores: [0.221, [6192, 7888]]},
            {scores: [0.3411, [6532, 'fall', 10222]]},
            {scores: [0.33, ['fall']]}, // 3
            {scores: [0.1421, [6532, 'fall', 10144]]},

            {scores: [0.35]}, // 5
            {scores: [0.96, [null, null]]},
            {scores: [0.21, [6192, 7888]]},
            {scores: [0.11, ['fs', 123]]},

            {scores: [0.13, [1123, 'fs']]}, // 9
            {scores: [0.312, [10132, 11432], {time: [5634]}]}
          ];

          const round = new SpeedRound({stage: 0, query: results.slice()});

          round.rankResults();
          const map = new Map(results.map((o, i) => [o, i+1]));

          assert.equals(
            Array.from(round).map(o => map.get(o)),
            [7, 1, 4, 2, 10, 8, 3, 9, 5, 6]);

          assert.equals(
            Array.from(round).map(o => ranking(o)),
            [1, 1, 3, 3, 5, 6, 6, 6, 9, 9]);
        });

        test("ties after cutoff", ()=>{
          const results = [
            {scores: [0.221, [5000, 6000]]},
            {scores: [0.421, [5000, 6000]]},
            {scores: [0.33, [7000, 7800]]}, // 3
            {scores: [0.14, [7000, 8000, 4000]]},

            {scores: [0.34, [7000, 8000, 4001]]}, // 5
            {scores: [0.94, [7000, 8000, 10000]]},
            {scores: [0.21, [7000, 9000]]},
            {scores: [0.11, ['fs', 1000]]},

            {scores: [0.13, [1000, 'fs']]}, // 9
            {scores: [0.312, ['fs']]}
          ];

          const round = new SpeedRound({stage: 0, query: results.slice()});

          const map = new Map(results.map((o, i) => [o, i+1]));

          round.rankResults();

          assert.equals(Array.from(round).map(o => map.get(o)), [2, 1, 3, 4, 6, 5, 7, 10, 8, 9]);
          assert.equals(Array.from(round).map(o => ranking(o)), [1, 1, 3, 4, 5, 5, 7, 8, 8, 8]);
        });
      });
    });

    test("rankGeneralResults", ()=>{
      const event = Factory.createEvent();
      const category = Factory.createCategory({type: "S"});
      const round = new SpeedRound({stage: -1, query: Result.query.withIndex(Result.eventCatIndex, {
        event_id: event._id, category_id: category._id})});

      round.rankResults();
      assert.same(round.cutoff, 4);
      assert.equals(toResId(round), []);

      const res = {};
      createResults(res, {
        r1: [0.31, [6001, 7000]],
        r2: [0.21, [6102, 7000]],
        r3: [0.41, [6204, 7000]],
        r4: [0.61, [6308, 7000]],
        r5: [0.2, [6501, 7000]],
        r6: [0.3, [6602, 7000]],
        r7: [0.4, [6704, 7000]],
        r8: [0.6, [6808, 7000]],
        r9: [0.1, [8300, 7016]],
      });
      res.r5.scores[1][0] = 6602;

      serverUpdScores(res.r5);

      round.rankResults();
      assert.same(round.cutoff, 8);
      assert.equals(toResId(round), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      assert.equals(toRanking(round), [1, 2, 3, 4, 5, 5, 7, 8, 9]);

      res.r1.scores[4] = {opponent_id: 'r8', time: 6543};
      res.r8.scores[4] = {opponent_id: 'r1', time: 6443};
      serverUpdScores(res.r1, res.r8);

      round.rankResults();
      assert.equals(toResId(round), [8, 1, 2, 3, 4, 5, 6, 7, 9]);

      res.r2.scores[4] = {opponent_id: 'r7', time: 6243};
      res.r7.scores[4] = {opponent_id: 'r2', time: 6343};
      serverUpdScores(res.r2, res.r7);

      round.rankResults();
      assert.equals(toResId(round), [2, 8, 7, 1, 3, 4, 5, 6, 9]);

      res.r8.scores[3] = {opponent_id: 'r2', time: 7643};
      res.r2.scores[3] = {opponent_id: 'r8', time: 7543};
      serverUpdScores(res.r2, res.r8);

      assert.same(Math.sign(private.compareFinals(res.r2, res.r8)), -1);
      round.rankResults();
      assert.equals(toResId(round), [2, 8, 7, 1, 3, 4, 5, 6, 9]);
      assert.equals(toRanking(round), [1, 2, 3, 4, 5, 6, 7, 7, 9]);
    });

    group("finals", ()=>{
      test("general results elim tied in 1/4", ()=>{
        const res = {};
        createResults(res, {
          r01: [0.3,[6001,7100],,,{opponent_id:'r08',time:7600},{opponent_id:'r16',time:7070}],
          r02: [0.2,[6102,7000],,,{opponent_id:'r07',time:6000},{opponent_id:'r15',time:7060}],
          r03: [0.4,[6204,7000],,,{opponent_id:'r06',time:7600},{opponent_id:'r14',time:7050}],
          r04: [0.6,[6308,7000],,,{opponent_id:'r05',time:7600},{opponent_id:'r13',time:7040}],
          r05: [0.3,[6501,7000],,,{opponent_id:'r04',time:6200},{opponent_id:'r12',time:7030}],
          r06: [0.2,[6602,7000],,,{opponent_id:'r03',time:6800},{opponent_id:'r11',time:7020}],
          r07: [0.4,[6001,7100],,,{opponent_id:'r02',time:7600},{opponent_id:'r10',time:7010}],
          r08: [0.6,[6808,7000],,,{opponent_id:'r01',time:6400},{opponent_id:'r09',time:7000}],

          r09: [0.1,[8000,10000],,,,{opponent_id:'r08',time:7400}],
          r10: [0.2,[8100,10000],,,,{opponent_id:'r07',time:7400}],
          r11: [0.3,[8200,10000],,,,{opponent_id:'r06',time:7400}],
          r12: [0.4,[8300,10000],,,,{opponent_id:'r05',time:7400}],
          r13: [0.5,[8400,10000],,,,{opponent_id:'r04',time:7400}],
          r14: [0.6,[8500,10000],,,,{opponent_id:'r03',time:7400}],
          r15: [0.7,[8600,10000],,,,{opponent_id:'r02',time:7400}],
          r16: [0.8,[8700,10000],,,,{opponent_id:'r01',time:7400}],
        });

        const round = new SpeedRound({
          stage: -1, previous: 4, query: Enumerable.propertyValues(res)});

        round.rankResults();

        assert.equals(toRanking(round), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        assert.equals(toResId(round), [2, 5, 6, 8, 7, 4, 3, 1, 9, 10, 11, 12, 13, 14, 15, 16]);

        res.r01.scores[5].time = 'wc';
        round.rankResults();

        assert.equals(toResId(round), [2, 5, 6, 8, 7, 1, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16]);
        assert.equals(toRanking(round), [1, 2, 3, 4, 5, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

        /** test incomplete scores **/
        res.r03.scores[4] = null;

        round.rankResults();

        assert.equals(toRanking(round), [1, 2, 3, 4, 5, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        assert.equals(toResId(round), [2, 5, 6, 8, 7, 1, 4, 3, 9, 10, 11, 12, 13, 14, 15, 16]);
      });

      test("qual < 4; no final", ()=>{
        TH.login();
        const res = {};
        createResults(res, {
          r1: [0.31, [6101, 7000]],
          r2: [0.21, [6002, 7000]],
          r3: [0.41, [6204, 7000]],
          r4: [0.61, ['fs', 7000]],
          r5: [0.20, [6501, 'fs']],
          r6: [0.30, ['fall', 'fall']],
          r7: [0.90, ['fs', 5234]],
        });



        const round = new SpeedRound({
          stage: 0, previous: 0, query: Enumerable.propertyValues(res)});
        round.calcStartList();


        round.rankResults();

        assert.equals(toRanking(round), [1, 2, 3, 4, 4, 4, 4]);
        assert.equals(toResId(round), [2, 1, 3, 5, 4, 6, 7]);
      });

      test("petit final", ()=>{
        const res = {};
        createResults(res, {
          r1: [0.32, [6001, 7000], , {opponent_id: 'r4', time: 6600}],
          r2: [0.22, [6102, 7000], , {opponent_id: 'r3', time: 6000}], //w
          r3: [0.42, [6204, 7000], , {opponent_id: 'r2', time: 6900}],
          r4: [0.62, [6308, 7000], , {opponent_id: 'r1', time: 6200}], //w
          r5: [0.31, [6309, 7000]],
          r6: [0.21, [6309, 7000]],
          r7: [0.41, [6704, 7000]],
          r8: [0.61, ['fs', 7000]],
          r9: [0.11, [8300, 'fs']],
        });

        const round = new SpeedRound({
          stage: 1, previous: 2, query: Enumerable.propertyValues(res)});
        round.calcStartList();

        assert.same(round.entries.length, 2);

        assert.equals(round.entries[0], res.r4);
        assert.equals(laneB(round.entries[0]), res.r2);

        assert.equals(round.entries[1], res.r1);
        assert.equals(laneB(round.entries[1]), res.r3);

        res.r4.scores[2] = {opponent_id: 'r2', time: 6700};
        res.r2.scores[2] = {opponent_id: 'r4', time: 6600};
        res.r1.scores[2] = {opponent_id: 'r3', time: 6500};
        res.r3.scores[2] = {opponent_id: 'r1', time: 6400};

        const general = new SpeedRound({stage: -1, query: Enumerable.propertyValues(res)});

        assert.same(Math.sign(private.compareFinals(res.r5, res.r6)), 0);
        assert.same(Math.sign(private.compareFinals(res.r4, res.r1)), -1);
        assert.same(Math.sign(private.compareFinals(res.r2, res.r1)), -1);
        assert.same(Math.sign(private.compareFinals(res.r2, res.r2)), 0);
        assert.same(Math.sign(private.compareFinals(res.r2, res.r3)), -1);
        assert.same(Math.sign(private.compareFinals(res.r2, res.r4)), -1);
        assert.same(Math.sign(private.compareFinals(res.r4, res.r2)), 1);
        assert.same(Math.sign(private.compareFinals(res.r1, res.r4)), 1);

        general.rankResults();
        assert.equals(toResId(general), [2, 4, 3, 1, 5, 6, 7, 8, 9]);
        assert.equals(toRanking(general), [1, 2, 3, 4, 5, 5, 7, 8, 8]);
      });

      test("isTimeValid", ()=>{
        const round = new SpeedRound({stage: 2});
        assert.isTrue(round.isTimeValid({scores: [0.4, ,, {time: 1234}]}));
        assert.isTrue(round.isTimeValid({scores: [0.4, ,, {time: 'wc'}]}));
        assert.isFalse(round.isTimeValid({scores: [0.4, ,, {time: 'fall'}]}));
        assert.isFalse(round.isTimeValid({scores: [0.4, ,, {time: 'fs'}]}));
      });

      test("hasClimbed", ()=>{
        const round = new SpeedRound({stage: 1});
        assert.isFalse(round.hasClimbed({scores: [0.4, []]}));
        assert.isFalse(round.hasClimbed({scores: [0.4, [null, null]]}));
        assert.isFalse(round.hasClimbed({scores: [0.4, [6532, 1234]]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, [6532, 1234], {time: 'fall'}]}));
        assert.isTrue(round.hasClimbed({scores: [0.4, [6532, 1234], {time: 1230}]}));
        assert.isFalse(round.hasClimbed({scores: [0.4, [6532, 1234], {time: null}]}));
      });

      test("checkValid missingScore", ()=>{
        const round = new SpeedRound({stage: 1});

        assert.same(round.checkValid({scores: [0.4, [1234, 5678]]}), missingScore);
        assert.same(round.checkValid({scores: [0.4]}), missingScore);
        assert.same(round.checkValid({scores: [0.4, , {time: null}]}), missingScore);
      });

      test("getTime", ()=>{
        const round = new SpeedRound({stage: 1});

        assert.same(round.getTime({scores: [0.4, [1234, 5678]]}, 0), null);
        assert.same(round.getTime({scores: [0.4, [1234, 5678], {time: 5678}]}, 11), 5678);
      });

      test("setTime", ()=>{
        const round = new SpeedRound({stage: 1});

        let opts;
        const setSpeedScore = v =>{opts = v};

        round.setTime({setSpeedScore}, {time: 123, opponent_id: 'o1'});
        assert.equals(opts, {time: 123, opponent_id: 'o1', stage: 1, attempt: 1});
      });

      group("startList", ()=>{
        test("after Quals", ()=>{
          const res = {};
          createResults(res, {
            r1: [0.3, [6001, 7000]],
            r2: [0.2, [6102, 7000]],
            r3: [0.4, [6204, 7000]],
            r4: [0.6, [6308, 7000]],
            r5: [0.3, [6501, 7000]],
            r6: [0.2, [6602, 7000]],
            r7: [0.4, [6704, 7000]],
            r8: [0.6, [6808, 7000]],
            r9: [0.1, [8300, 7016]],
          });

          const round = new SpeedRound({
            stage: 3, previous: 0, query: Enumerable.propertyValues(res)});
          round.calcStartList();

          assert.equals(toResId(round), [1, 4, 2, 3]);
          assert.same(laneB(res.r1), res.r8);
          assert.same(ranking(res.r1), 0);

          assert.same(ranking(res.r4), 1);
          assert.same(laneA(res.r4), res.r4);
          assert.same(laneB(res.r4), res.r5);

          assert.same(ranking(res.r2), 2);
          assert.same(laneB(res.r2), res.r7);
          assert.same(laneA(res.r7), res.r2);

          assert.same(ranking(res.r3), 3);
          assert.same(laneB(res.r3), res.r6);
          assert.same(laneA(res.r6), res.r3);
        });

        test("whoWonFinals", ()=>{
          const res = {};
          createResults(res, {
            r1: [0.3, [6001, 7000], , , {opponent_id: 'r8', time: 6600}],
            r2: [0.2, [6102, 7000], , , {opponent_id: 'r7', time: 6000}], //w
            r3: [0.4, [6204, 7000], , , {opponent_id: 'r6', time: 6900}],
            r4: [0.6, [6308, 7000], , , {opponent_id: 'r5', time: 6200}],
            r5: [0.3, [6308, 7000], , , {opponent_id: 'r4', time: 6200}], //tie
            r6: [0.2, [6602, 7000], , , {opponent_id: 'r3', time: null}], //not finished
            r7: [0.4, [6704, 7000], , , {opponent_id: 'r2', time: 6100}],
            r8: [0.6, [6808, 7000], , , {opponent_id: 'r1', time: 6400}], //w
            r9: [0.1, [8300, 7016]],
          });

          const round = new SpeedRound({
            stage: 3, previous: 0, query: Enumerable.propertyValues(res)});
          round.calcStartList();

          assert.same(round.whoWonFinals(res.r3), null);
          assert.same(round.whoWonFinals(res.r1), res.r8);
          assert.same(round.whoWonFinals(res.r2), res.r2);
          assert.same(round.whoWonFinals(res.r4), null);

          res.r5.scores[1][1] = 7001;
          assert.same(round.whoWonFinals(res.r4), res.r4);
          res.r4.scores[1][1] = 7002;
          assert.same(round.whoWonFinals(res.r4), res.r5);
        });

        test("after quaters", ()=>{
          const res = {};
          createResults(res, {
            r1: [0.3, [6001, 7000], , , {opponent_id: 'r8', time: 6600}],
            r2: [0.2, [6102, 7000], , , {opponent_id: 'r7', time: 6000}], //w
            r3: [0.4, [6204, 7000], , , {opponent_id: 'r6', time: 6900}],
            r4: [0.6, [6308, 7000], , , {opponent_id: 'r5', time: 6400}],
            r5: [0.3, [6501, 7000], , , {opponent_id: 'r4', time: 6200}], //w
            r6: [0.2, [6602, 7000], , , {opponent_id: 'r3', time: 6800}], //w
            r7: [0.4, [6704, 7000], , , {opponent_id: 'r2', time: 6100}],
            r8: [0.6, [6808, 7000], , , {opponent_id: 'r1', time: 6400}], //w
            r9: [0.1, [8300, 7016]],
          });

          const round = new SpeedRound({
            stage: 2, previous: 3, query: Enumerable.propertyValues(res)});
          round.calcStartList();

          assert.equals(toResId(round), [8, 2]);
          assert.same(laneB(res.r8), res.r5);
          assert.same(ranking(res.r8), 0);

          assert.same(laneA(res.r5), res.r8);
          assert.same(laneB(res.r5), res.r5);

          assert.same(ranking(res.r2), 1);
          assert.same(laneB(res.r2), res.r6);
          assert.same(laneA(res.r6), res.r2);
        });
      });

      test("rankResults calls calcStartList", ()=>{

        const round = new SpeedRound({stage: 1, previous: 2, query: []});
        stub(round, 'calcStartList');

        round.rankResults();

        assert.called(round.calcStartList);
      });
    });
  });
});
