define((require, exports, module)=>{
  const util            = require('koru/util');
  const TH              = require('test-helper');

  const Heat = require('./heat');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    test("type", ()=>{
      const heat = new Heat(1, 'LQQF26F26F8');

      assert.same(heat.type, 'L');
    });

    test("rankIndex", ()=>{
      let heat = new Heat(1, 'LQ:8QF26F26F8');
      assert.same(heat.rankIndex, 2);

      heat = new Heat(1, 'LQQQF8');
      assert.same(heat.rankIndex, 3);
    });

    test("isFinalRound", ()=>{
      const heat = new Heat(1, 'LQQF26F26F8');
      assert.isFalse(heat.isFinalRound());

      heat.number = 5;
      assert.isTrue(heat.isFinalRound());
    });

    group("problem count", ()=>{
      let format;

      const assertProblems = (heatNum, expect)=>{
        const heat = new Heat(heatNum, format);
        assert.same(heat.problems, expect);
      };

      test("mixed count", ()=>{
        format = 'BQQ:3QF26F26:2F8';

        assertProblems(1, 5);
        assertProblems(2, 3);
        assertProblems(3, 3);
        assertProblems(4, 4);
        assertProblems(5, 2);
        assertProblems(6, 2);
      });

      test("defaults", ()=>{
        format = 'BQF';

        assertProblems(1, 5);
        assertProblems(2, 4);
      });

      test("all set", ()=>{
        format = 'BQ:8F6:3';

        assertProblems(1, 8);
        assertProblems(2, 3);
      });
    });

    test("name", ()=>{
      const heat = new Heat(-1, 'LQQF26F26F8');

      assert.same(heat.name, 'General');

      heat.number = 0;
      assert.same(heat.name, 'Start order');

      heat.number = 1;
      assert.same(heat.name, 'Qual 1');

      heat.number = 2;
      assert.same(heat.name, 'Qual 2');

      heat.number = -2;
      assert.same(heat.name, 'Qual points');

      heat.number = 3;
      assert.same(heat.name, 'Quarter final');

      heat.number = 4;
      assert.same(heat.name, 'Semi final');

      heat.number = 5;
      assert.same(heat.name, 'Final');
    });

    test("lead scoreToNumber", ()=>{
      const heat = new Heat(1, 'LQQF26F26F8');

      assert.same(heat.scoreToNumber(' 23.5+'   ),  235005);
      assert.same(heat.scoreToNumber('123.012+' ), 1230125);
      assert.same(heat.scoreToNumber('10 '      ),  100000);
      assert.same(heat.scoreToNumber('top'      ), 9999999);
      assert.same(heat.scoreToNumber(' ter '    ), 9999999);
      assert.same(heat.scoreToNumber(' dnc '    ),      -1);
      assert.same(heat.scoreToNumber(' 4:33 '   ),   false);
      assert.same(heat.scoreToNumber(' 4:33 ',99),     273);
      assert.same(heat.scoreToNumber(' 1:09 ',99),      69);
    });

    test("boulder boulderScoreToNumber", ()=>{
      const heat = new Heat(1, 'BFF');

      assert.same(heat.boulderScoreToNumber(4,6,3,3  ), 3049693);
      assert.same(heat.boulderScoreToNumber(0,0,0,0  ),    9999);
      assert.same(heat.boulderScoreToNumber(4,20,0,0 ),   49979);
      assert.same(heat.boulderScoreToNumber(5,99,2,20), 2057900);

      assert.same(heat.boulderScoreToNumber(4,6,3,3  , 0), 3960493);
      assert.same(heat.boulderScoreToNumber(0,0,0,0  , 0),  990099);
      assert.same(heat.boulderScoreToNumber(4,20,0,0 , 0),  990479);
      assert.same(heat.boulderScoreToNumber(5,99,2,20, 0), 2790500);
    });

    test("lead numberToScore", ()=>{
      const heat = new Heat(1, 'LQQF26F26F8');

      assert.same(heat.numberToScore( 235005   ),  '23.5+');
      assert.same(heat.numberToScore(1230125   ), '123.012+');
      assert.same(heat.numberToScore( 100000   ),  '10');
      assert.same(heat.numberToScore(9999999   ), 'Top');
      assert.same(heat.numberToScore(     -1   ), 'DNC');
      assert.same(heat.numberToScore(          ), '');
      assert.same(heat.numberToScore(1, 0      ), 1);
      assert.same(heat.numberToScore(1.535, -2 ), 1.54);
    });

    test("boulder numberToScore", ()=>{
      const heat = new Heat(1, 'BFF');

      assert.same(heat.numberToScore(     -1   ), 'DNC');
      assert.same(heat.numberToScore(          ), '');
      // ASK what situation is this testing?
      assert.same(heat.numberToScore(1, 0      ), 1);
      assert.same(heat.numberToScore(1.535, -2 ), 1.54);

      assert.same(heat.numberToScore(3049693  ), '3T4Z3AT6AZ');
      assert.same(heat.numberToScore(0        ), '0T0Z');
      assert.same(heat.numberToScore(9999     ), '0T0Z');
      assert.same(heat.numberToScore( 49979   ), '0T4Z0AT20AZ');
      assert.same(heat.numberToScore(2057900  ), '2T5Z20AT99AZ');

      assert.same(heat.numberToScore(3960493   , null, 0), '3t3 4b6');
      assert.same(heat.numberToScore(0         , null, 0), '0t 0b');
      assert.same(heat.numberToScore( 990479   , null, 0), '0t 4b20');
      assert.same(heat.numberToScore(2790500   , null, 0), '2t20 5b99');
    });

    group("sortByStartOrder", ()=>{
      const call = (number, results)=>{
        const heat = new Heat(number, 'LQQF26F8');

        return heat.sortByStartOrder(results);
      };

      test("final tie", ()=>{
        let r1, r2, r3, r4;
        const heat = new Heat(3, 'LQF8F2');
        const results = [
          r1 = {scores: [0.21, 300, 300]}, r2 = {scores: [0.42, 400, 300]},
          r3 = {scores: [0.33, 300, 300]}, r4 = {scores: [0.14, 50, 300, 500]}];

        let ans = heat.sortByStartOrder(results.slice(0));

        assert.same(ans.length, 3);
        assert.equals(ans, [r1, r3, r2]);

        r1.scores[0] = 0.22;

        ans = heat.sortByStartOrder(results.slice(0));

        assert.equals(ans, [r3, r1, r2]);
      });

      test("final no tie", ()=>{
        let r1, r2, r3, r4;
        const heat = new Heat(3, 'LQF8F2');
        let results = [
          r1 = {scores: [0.2, 400, 300]}, r2 = {scores: [0.4, 400, 100]},
          r3 = {scores: [0.3, 300, 300]}, r4 = {scores: [0.1, 50, 300, 500]}];

        results = heat.sortByStartOrder(results);

        assert.same(results.length, 2);
        assert.equals(results, [r3, r1]);

      });

      test("nulls in scores", ()=>{
        let r0, r1, r2, r3;
        const heat = new Heat(3, 'LQQF2');
        let results = [r0 = {scores: [0.53, 340000, 430000]},
                       r1 = {scores: [0.98,  30000, 320000, null]},
                       r2 = {scores: [0.52, 340000, 100000, null]},
                       r3 = {scores: [0.68, 340000, 100000, null]}];

        results = heat.sortByStartOrder(results);

        assert.same(results.length, 3);
        assert.equals(results, [r3, r2, r0]);
      });

      test("odd", ()=>{
        let r1, r2, r3;
        const  results = [r1 = {scores: [0.2]}, r2 = {scores: [0.4]}, r3 = {scores: [0.3]}];
        assert.equals(call(1, results), [r2, r3, r1]);

        assert.equals(call(2, results), [r1, r2, r3]);
      });

      test("even", ()=>{
        let r1, r2;
        const results = [r1 = {scores: [0.2]}, r2 = {scores: [0.4]}];
        assert.equals(call(1, results), [r2, r1]);

        assert.equals(call(2, results), [r1, r2]);
      });
    });

    group("sort", ()=>{
      const call = (number, results)=>{
        const heat = new Heat(number, 'LQQF26F8');
        return heat.sort(results);
      };

      test("empty", ()=>{
        assert.equals(call(-1, []), []);
      });

      test("final", ()=>{
        let r1, r2, r3;
        const results = [r1 = {time: 30, scores: [0.2, 200, 300, 400, 300]},
                         r2 = {time: 123, scores: [0.3, 100, 300, 400, 400]},
                         r3 = {time: 100, scores: [0.3, 100, 300, 400, 400]}];

        assert.equals(call(4, results), [r3, r2, r1]);
        assert.same(r3.sPoints, 100);
        assert.same(r2.sPoints, 80);
        assert.same(r1.sPoints, 65);

        r3.time = 200;

        assert.equals(call(4, results), [r2, r3, r1]);
        assert.same(r2.sPoints, 100);
        assert.same(r3.sPoints, 80);
        assert.same(r1.sPoints, 65);
      });

      test("General Result", ()=>{
        let r1, r2, r3;
        let results = [r1 = {scores: [0.2]}, r2 = {scores: [0.4]}];
        assert.equals(call(-1, results), [r2, r1]);

        results = [r1 = {scores: [0.2, 100]}, r2 = {scores: [0.4]}];
        assert.equals(call(-1, results), [r1, r2]);

        results = [r1 = {scores: [0.2, 100]}, r2 = {scores: [0.1, 200]}];
        assert.equals(call(-1, results), [r2, r1]);


        results = [r1 = {scores: [0.2, 200, 300]}, r2 = {scores: [0.3, 100, 300]},
                   r3 = {scores: [0.1, 50, 400]}];
        assert.equals(call(-1, results), [r1, r3, r2]);
      });

      test("points with time split", ()=>{
        let r1, r2;
        const results = [
          r1 = {time: 30, scores: [0.2, 100]},
          r2 = {time: 123, scores: [0.3, 100]},
        ];

        assert.equals(new Heat(-1, 'LF4').sort(results), [r1, r2]);
        assert.same(r1.sPoints, 100);
        assert.same(r2.sPoints, 80);
      });

      group("Ranking general result", ()=>{
        let r1, r2, r3, s1, s2, s3;
        let results;

        const run = ()=> call(-1, results);

        beforeEach(()=>{
          results =[r1 = {scores: s1 = [0.2]},
                    r2 = {scores: s2 = [0.4]},
                    r3 = {scores: s3 = [0.3]}];
        });

        test("no scores", ()=>{
          run();

          assert.same(r1.rank1, 2);

          assert.same(r1.rankMult, 4);
          assert.same(r2.rankMult, 4);
        });

        test("diff length", ()=>{
          s1.push(null);
          run();

          assert.same(r1.rankMult, 4);
        });

        test("semis 2 null", ()=>{
          s1.push(500, 10, 999);
          s2.push(500, 10, null);
          s3.push(500, 10);

          assert.equals(run(), [r1, r3, r2]);
        });

        test("semis 3 null", ()=>{
          s1.push(500, 10, 999);
          s2.push(500, 10);
          s3.push(500, 10, null);

          assert.equals(run(), [r1, r3, r2]);
        });

        test("quals", ()=>{
          s1.push(500, 300);
          s2.push(500, 30);
          s3.push(50, 400);

          run();

          assert.same(r1.rank1, 1.5);
          assert.same(r2.rank1, 1.5);
          assert.same(r3.rank1, 3);

          assert.same(r1.rank2, 2);
          assert.same(r2.rank2, 3);
          assert.same(r3.rank2, 1);

          assert.same(r1.rankMult, 3);
          assert.same(r2.rankMult, 4.5);
          assert.same(r3.rankMult, 3);
        });

        test("finals split by time", ()=>{
          s1.push(500, 300, 200);
          s2.push(500, 300, 200);
          s3.push(500, 300, 200);

          let ans = run();
          assert.equals(ans, [r1, r3, r2]);
          assert.same(r1.sPoints, 81);
          assert.same(r2.sPoints, 81);


          r1.time = 123;
          r2.time = 122;
          r3.time = 224;

          ans = run();
          assert.equals(ans, [r2, r1, r3]);
          assert.same(r1.sPoints, 80);
          assert.same(r2.sPoints, 100);
          assert.same(r3.sPoints, 65);

          r1.time = 123;
          r2.time = 124;
          r3.time = 24;

          ans = run();
          assert.equals(ans, [r3, r1, r2]);
          assert.same(r1.sPoints, 80);
          assert.same(r2.sPoints, 65);
          assert.same(r3.sPoints, 100);
        });


        test("sPoints noScores", ()=>{
          run();

          assert.same(r2.sPoints, null);
          assert.same(r3.sPoints, null);
          assert.same(r1.sPoints, null);
        });

        test("sPoints three scores", ()=>{
          results =[r1 = {scores: s1 = [0.2, 200]},
                      r2 = {scores: s2 = [0.4, 400]},
                      r3 = {scores: s3 = [0.3, 300]},
                     ];
          run();

          assert.same(r2.sPoints, 100);
          assert.same(r3.sPoints, 80);
          assert.same(r1.sPoints, 65);

          r3.scores = util.shallowCopy(r1.scores);
          run();

          assert.same(r3.sPoints, 72);
          assert.same(r3.sPoints, 72);
        });

        test("sPoints more than 30", ()=>{
          const v = {};
          results = [];
          for (let i = 0; i < 31; ++i) {
            results.push(v['r'+i] = {scores: [0.1, -100*i]});
          }

          run();

          for (let i = 0; i < 30; ++i) {
            assert.same(v['r'+i].sPoints, Heat.pointsTable[i]);
          }
          assert.same(v.r30.sPoints, 0);
        });
      });

      test("sorting methods", ()=>{
        let r1, r2, r3;
        let results = [
          r1 = {scores: [0.2, 500, 300]}, r2 = {scores: [0.3, 500, 30]},
          r3 = {scores: [0.1, 50, 400]}];

        assert.equals(call(2, results), [r3, r1, r2]);

        assert.equals(call(1, results), [r1, r2, r3]);

        assert.equals(call(0, results), [r2, r1, r3]);

      });
    });

    group("qual only", ()=>{
      let heat;
      const call = (number)=>{
        heat = new Heat(number, 'LQQQ');
        const results = [];

        heat.headers((number, name) => {
          results.push({number: number, name: name});
        });

        return results;
      };

      test("last qual result", ()=>{
        assert.equals(call(3), [
          {number: 3, name: 'Result'},
        ]);
      });

      test("genral results", ()=>{
        assert.equals(call(-1), [
          {number: -2, name: 'Rank'},
          {number: -2, name: 'Qual points'},
          {number: 3, name: 'Qual 3'},
          {number: 2, name: 'Qual 2'},
          {number: 1, name: 'Qual 1'},
        ]);

        let r1, r2, r3;
        const results = [r1 = {scores: [0.2, 200, 300, 400, 300]},
                         r2 = {scores: [0.3, 100, 300, 400, 400]},
                         r3 = {scores: [0.4, 100, 300, 600, 400]}];

        heat.sort(results);

        assert.equals(results, [
          {scores: [0.2, 200, 300, 400, 300], rankMult: 5,
           rank3: 2.5, rank2: 2, rank1: 1, sPoints: 90},
          {scores: [0.4, 100, 300, 600, 400], rankMult: 5,
           rank3: 1, rank2: 2, rank1: 2.5, sPoints: 90},
          {scores: [0.3, 100, 300, 400, 400], rankMult: 12.5,
           rank3: 2.5, rank2: 2, rank1: 2.5, sPoints: 65}]);
      });
    });

    group("headers", ()=>{
      const call = (number, format='LQQF26F8')=>{
        const heat = new Heat(number, format);

        const results = [];

        heat.headers((number, name) => {
          results.push({number: number, name: name});
        });

        return results;
      };

      test("General", ()=>{
        assert.equals(call(-1), [
          {number: -2, name: 'Rank'},
          {number: 4, name: 'Final'},
          {number: 3, name: 'Semi final'},
          {number: -2, name: 'Qual points'},
          {number: 2, name: 'Qual 2'},
          {number: 1, name: 'Qual 1'},
        ]);
      });

      test("Final boulder", ()=>{
        assert.equals(call(2, "BQF6"), [
          {number: 2, name: 'Result'},
          {number: 2, name: 'Sum'},
          {number: -2, name: 'Previous heat'},
        ]);
      });

      test("Final", ()=>{
        assert.equals(call(4), [
          {number: 99, name: 'Time taken'},
          {number: 4, name: 'Result'},
          {number: 3, name: 'Previous heat'},
        ]);
      });

      test("Semi Final", ()=>{
        assert.equals(call(3), [
          {number: 3, name: 'Result'},
          {number: -2, name: 'Previous heat'},
        ]);
      });

      test("Qual", ()=>{
        assert.equals(call(2), [
          {number: 2, name: 'Result'},
        ]);

        assert.equals(call(1), [
          {number: 1, name: 'Result'},
        ]);
      });

      test("Start order", ()=>{
        assert.equals(call(0), [
          {number: 0, name: 'Start order'},
        ]);
      });
    });

    test("points table", ()=>{
      assert.equals(Heat.pointsTable,[
        100, 80, 65, 55, 51, 47, 43, 40, 37, 34,
        31,  28, 26, 24, 22, 20, 18, 16, 14, 12,
        10,  9,  8,  7,  6,  5,  4,  3,  2,  1,
      ]);
      assert.same(Heat.pointsTable.length, 30);
    });
  });
});
