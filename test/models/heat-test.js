(function (test, v) {
  buster.testCase('models/heat:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test type": function () {
      var heat = new AppModel.Heat(1, 'LQQF26F26F8');

      assert.same(heat.type, 'L');
    },

    "test rankIndex": function () {
      var heat = new AppModel.Heat(1, 'LQQF26F26F8');
      assert.same(heat.rankIndex, 2);

      var heat = new AppModel.Heat(1, 'LQQQF8');
      assert.same(heat.rankIndex, 3);
    },

    "test isFinalRound": function () {
      var heat = new AppModel.Heat(1, 'LQQF26F26F8');
      assert.isFalse(heat.isFinalRound());

      heat.number = 5;
      assert.isTrue(heat.isFinalRound());
    },

    "test name": function () {
      var heat = new AppModel.Heat(-1, 'LQQF26F26F8');

      assert.same(heat.name, 'General');

      heat.number = 0;
      assert.same(heat.name, 'Start order');

      heat.number = 1;
      assert.same(heat.name, 'Qual 1');

      heat.number = 2;
      assert.same(heat.name, 'Qual 2');

      heat.number = -2;
      assert.same(heat.name, 'Qual Rank');

      heat.number = 3;
      assert.same(heat.name, 'Quarter Final');

      heat.number = 4;
      assert.same(heat.name, 'Semi Final');

      heat.number = 5;
      assert.same(heat.name, 'Final');
    },

    "test lead scoreToNumber": function () {
      var heat = new AppModel.Heat(1, 'LQQF26F26F8');

      assert.same(heat.scoreToNumber(' 23.5+'   ),  235005);
      assert.same(heat.scoreToNumber('123.012+' ), 1230125);
      assert.same(heat.scoreToNumber('10 '      ),  100000);
      assert.same(heat.scoreToNumber('top'      ), 9999999);
      assert.same(heat.scoreToNumber(' ter '    ), 9999999);
      assert.same(heat.scoreToNumber(' dnc '    ),      -1);
      assert.same(heat.scoreToNumber(' 4:33 '   ),   false);
      assert.same(heat.scoreToNumber(' 4:33 ',99),     273);
    },

    "test lead numberToScore": function () {
      var heat = new AppModel.Heat(1, 'LQQF26F26F8');

      assert.same(heat.numberToScore( 235005   ),  '23.5+');
      assert.same(heat.numberToScore(1230125   ), '123.012+');
      assert.same(heat.numberToScore( 100000   ),  '10');
      assert.same(heat.numberToScore(9999999   ), 'Top');
      assert.same(heat.numberToScore(     -1   ), 'DNC');
      assert.same(heat.numberToScore(          ), '');
      assert.same(heat.numberToScore(1, 0      ), 1);
      assert.same(heat.numberToScore(1.535, -2 ), 1.54);
    },

    "test boulder scoreToNumber": function () {
      var heat = new AppModel.Heat(1, 'BFF');

      assert.same(heat.scoreToNumber(' 3t3 4b6 ' ), 3960493);
      assert.same(heat.scoreToNumber(' 0'        ),       0);
      assert.same(heat.scoreToNumber(' 0t 0b '   ),  990099);
      assert.same(heat.scoreToNumber(' 0t 4b20'  ),  990479);
      assert.same(heat.scoreToNumber(' 2t20 5b99'), 2790500);
      assert.same(heat.scoreToNumber(' dnc '     ),      -1);
    },

    "test boulder numberToScore": function () {
      var heat = new AppModel.Heat(1, 'BFF');

      assert.same(heat.numberToScore(3960493   ), '3t3 4b6');
      assert.same(heat.numberToScore(0         ), '0t 0b');
      assert.same(heat.numberToScore( 990479   ), '0t 4b20');
      assert.same(heat.numberToScore(2790500   ), '2t20 5b99');
      assert.same(heat.numberToScore(     -1   ), 'DNC');
      assert.same(heat.numberToScore(          ), '');
      assert.same(heat.numberToScore(1, 0      ), 1);
      assert.same(heat.numberToScore(1.535, -2 ), 1.54);
    },

    "sortByStartOrder": {
      setUp: function () {
        v.call = function (number, results) {
          v.heat = new AppModel.Heat(number, 'LQQF26F8');

          return v.heat.sortByStartOrder(results);
        };
      },

      "test odd": function () {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}, v.r3 = {scores: [0.3]}];
        assert.equals(v.call(1, results), [v.r2, v.r3, v.r1]);

        assert.equals(v.call(2, results), [v.r1, v.r2, v.r3]);
      },

      "test even": function () {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(1, results), [v.r2, v.r1]);

        assert.equals(v.call(2, results), [v.r1, v.r2]);
      },
    },

    "sort": {
      setUp: function () {
        v.call = function (number, results) {
          v.heat = new AppModel.Heat(number, 'LQQF26F8');

          return v.heat.sort(results);
        };
      },

      "test empty": function () {
        assert.equals(v.call(-1, []), []);
      },



      "test final": function () {
        var results = [v.r1 = {time: 30, scores: [0.2, 200, 300, 400, 300]},
                       v.r2 = {time: 123, scores: [0.3, 100, 300, 400, 400]},
                       v.r3 = {time: 100, scores: [0.3, 100, 300, 400, 400]}];

        assert.equals(v.call(4, results), [v.r3, v.r2, v.r1]);

        v.r3.time = 200;

        assert.equals(v.call(4, results), [v.r2, v.r3, v.r1]);
      },

      "test General Result": function () {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(-1, results), [v.r2, v.r1]);

        var results = [v.r1 = {scores: [0.2, 100]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(-1, results), [v.r1, v.r2]);

        var results = [v.r1 = {scores: [0.2, 100]}, v.r2 = {scores: [0.1, 200]}];
        assert.equals(v.call(-1, results), [v.r2, v.r1]);


        var results = [v.r1 = {scores: [0.2, 200, 300]}, v.r2 = {scores: [0.3, 100, 300]}, v.r3 = {scores: [0.1, 50, 400]}];
        assert.equals(v.call(-1, results), [v.r1, v.r3, v.r2]);
      },

      "Ranking general result": {
        setUp: function () {
          v.results =[v.r1 = {scores: v.s1 = [0.2]},
                      v.r2 = {scores: v.s2 = [0.4]},
                      v.r3 = {scores: v.s3 = [0.3]},
                     ];
          v.run = function () {
            return v.call(-1, v.results);
          };
        },

        "test no scores": function () {
          v.run();

          assert.same(v.r1.rank1, 2);

          assert.same(v.r1.rankMult, 4);
          assert.same(v.r2.rankMult, 4);
        },

        "test diff length": function () {
          v.s1.push(null);
          v.run();

          assert.same(v.r1.rankMult, 4);
        },

        "test semis 2 null": function () {
          v.s1.push(500, 10, 999);
          v.s2.push(500, 10, null);
          v.s3.push(500, 10);

          assert.equals(v.run(), [v.r1, v.r2, v.r3]);
        },

        "test semis 3 null": function () {
          v.s1.push(500, 10, 999);
          v.s2.push(500, 10);
          v.s3.push(500, 10, null);

          assert.equals(v.run(), [v.r1, v.r2, v.r3]);
        },

        "test quals": function () {
          v.s1.push(500, 300);
          v.s2.push(500, 30);
          v.s3.push(50, 400);

          v.run();

          assert.same(v.r1.rank1, 1.5);
          assert.same(v.r2.rank1, 1.5);
          assert.same(v.r3.rank1, 3);

          assert.same(v.r1.rank2, 2);
          assert.same(v.r2.rank2, 3);
          assert.same(v.r3.rank2, 1);

          assert.same(v.r1.rankMult, 3);
          assert.same(v.r2.rankMult, 4.5);
          assert.same(v.r3.rankMult, 3);
        },
      },

      "test sorting methods": function () {
        var results = [v.r1 = {scores: [0.2, 500, 300]}, v.r2 = {scores: [0.3, 500, 30]}, v.r3 = {scores: [0.1, 50, 400]}];

        assert.equals(v.call(2, results), [v.r3, v.r1, v.r2]);

        assert.equals(v.call(1, results), [v.r1, v.r2, v.r3]);

        assert.equals(v.call(0, results), [v.r2, v.r1, v.r3]);

      },
    },

    "headers": {
      setUp: function () {
        v.call = function (number) {
          v.heat = new AppModel.Heat(number, v.format || 'LQQF26F8');

          v.results = [];

          v.heat.headers(function (number, name) {
            v.results.push({number: number, name: name});
          });

          return v.results;
        };
      },

      "test General": function () {
        assert.equals(v.call(-1), [
          {number: -2, name: 'Rank'},
          {number: 4, name: 'Final'},
          {number: 3, name: 'Semi Final'},
          {number: -2, name: 'Qual Rank'},
          {number: 2, name: 'Qual 2'},
          {number: 1, name: 'Qual 1'},
        ]);
      },

      "test Final boulder": function () {
        v.format = "BFF6";

        assert.equals(v.call(2), [
          {number: 2, name: 'Result'},
          {number: 1, name: 'Previous heat'},
        ]);
      },

      "test Final": function () {
        assert.equals(v.call(4), [
          {number: 99, name: 'Time taken'},
          {number: 4, name: 'Result'},
          {number: 3, name: 'Previous heat'},
        ]);
      },

      "test Semi Final": function () {
        assert.equals(v.call(3), [
          {number: 3, name: 'Result'},
          {number: -2, name: 'Previous heat'},
        ]);
      },

      "test Qual": function () {
        assert.equals(v.call(2), [
          {number: 2, name: 'Result'},
        ]);

        assert.equals(v.call(1), [
          {number: 1, name: 'Result'},
        ]);
      },

      "test Start order": function () {
        assert.equals(v.call(0), [
          {number: 0, name: 'Start order'},
        ]);
      },
    },
  });
})();
