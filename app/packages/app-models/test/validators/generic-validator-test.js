(function (test, v) {
  buster.testCase('packages/app-models/validators/generic-validator:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test calls": function () {
      var doc = {};

      var func = test.stub();

      AppVal.validators('validate')(doc,'foo', func);


      assert.calledOnceWith(func, 'foo');
      assert.same(func.thisValues[0], doc);
    },
  });
})();
