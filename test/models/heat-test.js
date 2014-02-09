(function (test, v) {
  buster.testCase('models/heat:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test name": function () {
      var heat = new AppModel.Heat(1, 'F8F26F26QQ');

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
  });
})();
