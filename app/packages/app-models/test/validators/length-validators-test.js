(function () {
  buster.testCase('packages/app-models/validators/max-length-validator:', {
    setUp: function () {
    },

    tearDown: function () {
    },

    'test too long': function () {
      var doc = {name: '123'};
      AppVal.validators('maxLength')(doc,'name', 2);

      assert(doc._errors);
      assert.equals(doc._errors['name'],[["too_long", 2]]);
    },

    'test missing': function () {
      var doc = {name: ''};
      AppVal.validators('maxLength')(doc,'name', 2);

      refute(doc._errors);
    },

    'test not too long': function () {
      var doc = {name: '123'};
      AppVal.validators('maxLength')(doc,'name', 3);

      refute(doc._errors);
    },
  });
})();
