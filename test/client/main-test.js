(function (test, v) {
  buster.testCase('client/main:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test main": function () {
      App._startup();
      assert.select('head', function () {
        assert.select('title', 'Piki');
      });
      assert.select('body', function () {
        assert.select('body>header');
      });
    },
  });
})();
