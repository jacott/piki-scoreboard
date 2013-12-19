(function () {
  buster.testCase('packages/app-models/error:', {
    'test msgFor': function () {
      var doc = {_errors: {foo: [['too_long', 34]]}};

      assert.same(AppVal.Error.msgFor(doc, 'foo'), "34 characters is the maximum allowed");
    },
  });
})();
