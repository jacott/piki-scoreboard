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

    "test name": function () {
      var heat = new AppModel.Heat(1, 'LF8F26F26QQ');

      assert.same(heat.name, 'Qualification 1');

      heat.number = 2;
      assert.same(heat.name, 'Qualification 2');

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
    },

    "test numberToScore": function () {
      var heat = new AppModel.Heat(1, 'LF8F26F26QQ');

      assert.same(heat.numberToScore(235005),  '23.5+');
      assert.same(heat.numberToScore(1230125), '123.012+');
      assert.same(heat.numberToScore(100000),  '10');
      assert.same(heat.numberToScore(9999999), 'Top');
      assert.same(heat.numberToScore(), '');
    },
  });
})();
