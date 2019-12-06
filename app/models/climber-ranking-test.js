isServer && define((require, exports, module)=>{
  'use strict';
  const TH              = require('koru/model/test-db-helper');
  const Category        = require('models/category');
  const Climber         = require('models/climber');
  const Event           = require('models/event');
  const Factory         = require('test/factory');

  const {stub, spy, util, match: m} = TH;

  const ClimberRanking = require('./climber-ranking');

  const createResults = (ans, opts)=>{
    for (const id in opts) {
      Factory.createClimber({name: 'climber_'+id, _id: 'cl'+id.slice(1)});
      ans[id] = Factory.createResult({_id: id, scores: opts[id]});
    }
  };


  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      TH.startTransaction();
    });

    afterEach(()=>{
      TH.rollbackTransaction();
    });

    test("summarize speed", ()=>{
      const cat = Factory.createCategory({type: 'S'});
      const ev = Factory.createEvent();

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

      ev.$update('date', '2019-11-02');

      assert.same(ClimberRanking.query.count(), 0);

      ev.$update('closed', true);

      const sum = ClimberRanking.db.query('select * from "ClimberRanking" order by climber_id');

      assert.equals(sum[0], {
        climber_id: 'cl01', event_id: ev._id, category_id: cat._id,
        rank: 8, points: 40, type: 'S'
      });

      assert.equals(sum.map(s => [s.climber_id, s.rank, s.points]), [
        ['cl01', 8, 40], ['cl02', 1, 100], ['cl03', 7, 43], ['cl04', 6, 47],
        ['cl05', 2, 80], ['cl06', 3, 65], ['cl07', 5, 51], ['cl08', 4, 55],
        ['cl09', 9, 37], ['cl10', 10, 34], ['cl11', 11, 31], ['cl12', 12, 28],
        ['cl13', 13, 26], ['cl14', 14, 24], ['cl15', 15, 22], ['cl16', 16, 20]]);
    });

    test("summarize lead", ()=>{
      const cat = Factory.createCategory({type: 'LQQF26F8'});
      const ev = Factory.createEvent();

      const res = {};
      createResults(res, {
        r01: [0.2, 200, 300],
        r02: [0.3, 100, 300],
        r03: [0.1, 50, 400],
        r04: [0.4, 50, 400],
      });

      ClimberRanking.summarize(ev);

      const sum = ClimberRanking.db.query('select * from "ClimberRanking" order by climber_id');

      assert.equals(sum[0], {
        climber_id: 'cl01', event_id: ev._id, category_id: cat._id,
        rank: 1, points: 100, type: 'L'
      });

      assert.equals(sum.map(s => [s.climber_id, s.rank, s.points]), [
        ['cl01', 1, 100], ['cl02', 4, 55], ['cl03', 2, 72], ['cl04', 2, 72]]);

      res.r04.$update({scores: [0.4, 1050, 400]});

      ev.$update('closed', true);

      assert.equals(
        ClimberRanking.db.query('select * from "ClimberRanking" order by climber_id')
          .map(s => [s.climber_id, s.rank, s.points]),
        [['cl01', 3, 65], ['cl02', 4, 55], ['cl03', 2, 80], ['cl04', 1, 100]]);
    });
  });
});
