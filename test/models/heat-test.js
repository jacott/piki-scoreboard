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
      var heat = new AppModel.Heat(1, 'LF8F26F26QQ');

      assert.same(heat.type, 'L');
    },

    "test rankIndex": function () {
      var heat = new AppModel.Heat(1, 'LF8F26F26QQ');
      assert.same(heat.rankIndex, 2);

      var heat = new AppModel.Heat(1, 'LF8QQQ');
      assert.same(heat.rankIndex, 3);
    },

    "test name": function () {
      var heat = new AppModel.Heat(-1, 'LF8F26F26QQ');

      assert.same(heat.name, 'General result');

      heat.number = 0;
      assert.same(heat.name, 'Start list');

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

    "test scoreToNumber": function () {
      var heat = new AppModel.Heat(1, 'LF8F26F26QQ');

      assert.same(heat.scoreToNumber(' 23.5+'),    235005);
      assert.same(heat.scoreToNumber('123.012+'), 1230125);
      assert.same(heat.scoreToNumber('10 '),       100000);
      assert.same(heat.scoreToNumber('top'),      9999999);
      assert.same(heat.scoreToNumber(' ter '),    9999999);
      assert.same(heat.scoreToNumber(' dnc '),    -1);
    },

    "test numberToScore": function () {
      var heat = new AppModel.Heat(1, 'LF8F26F26QQ');

      assert.same(heat.numberToScore(235005),  '23.5+');
      assert.same(heat.numberToScore(1230125), '123.012+');
      assert.same(heat.numberToScore(100000),  '10');
      assert.same(heat.numberToScore(9999999), 'Top');
      assert.same(heat.numberToScore(-1), 'DNC');
      assert.same(heat.numberToScore(), '');
      assert.same(heat.numberToScore(1, 0), 1);
      assert.same(heat.numberToScore(1.535, -2), 1.54);

    },

    "sort": {
      setUp: function () {
        v.call = function (number, results) {
          v.heat = new AppModel.Heat(number, 'LF8F26QQ');

          return v.heat.sort(results);
        };
      },

      "test General Result": function () {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(-1, results), [v.r1, v.r2]);

        var results = [v.r1 = {scores: [0.2, 100]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(-1, results), [v.r1, v.r2]);

        var results = [v.r1 = {scores: [0.2, 100]}, v.r2 = {scores: [0.1, 200]}];
        assert.equals(v.call(-1, results), [v.r2, v.r1]);


        var results = [v.r1 = {scores: [0.2, 200, 300]}, v.r2 = {scores: [0.3, 100, 300]}, v.r3 = {scores: [0.1, 50, 400]}];
        assert.equals(v.call(-1, results), [v.r1, v.r3, v.r2]);
      },

      "test ranks": function () {
        var results = [v.r1 = {scores: [0.2, 500, 300]}, v.r2 = {scores: [0.3, 500, 30]}, v.r3 = {scores: [0.1, 50, 400]}];
        v.call(-1, results);

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

      "test sorting methods": function () {
        var results = [v.r1 = {scores: [0.2, 500, 300]}, v.r2 = {scores: [0.3, 500, 30]}, v.r3 = {scores: [0.1, 50, 400]}];

        assert.equals(v.call(2, results), [v.r3, v.r1, v.r2]);

        assert.same(v.r3.scores[0], 3);
        assert.same(v.r1.scores[0], 2);
        assert.same(v.r2.scores[0], 1);

        assert.equals(v.call(1, results), [v.r1, v.r2, v.r3]);

        assert.equals(v.call(0, results), [v.r2, v.r1, v.r3]);

      },
    },

    "headers": {
      setUp: function () {
        v.call = function (number) {
          v.heat = new AppModel.Heat(number, 'LF8F26QQ');

          v.results = [];

          v.heat.headers(function (number, name) {
            v.results.push({number: number, name: name});
          });

          return v.results;
        };
      },

      "test General result": function () {
        assert.equals(v.call(-1), [
          {number: 4, name: 'Final'},
          {number: 3, name: 'Semi Final'},
          {number: -2, name: 'Qual Rank'},
          {number: 2, name: 'Qual 2'},
          {number: 1, name: 'Qual 1'},
          {number: 0, name: 'Start list'},
        ]);
      },

      "test Final": function () {
        assert.equals(v.call(4), [
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

      "test Start list": function () {
        assert.equals(v.call(0), [
          {number: 0, name: 'Start list'},
        ]);
      },
    },
  });
})();
