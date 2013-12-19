(function (test, v) {
  buster.testCase('packages/app-models/validators/inclusion-validator:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test allow null": function () {
      var doc = {state: null};
      AppVal.validators('inclusion')(doc,'state', {allowBlank: true, matches: /foo/});
      refute(doc._errors);

      AppVal.validators('inclusion')(doc,'state', {matches: /^foo$/});
      assert(doc._errors);
      assert.equals(doc._errors['state'],[['invalid_format']]);


      var doc = {state: ''};
      AppVal.validators('inclusion')(doc,'state', {allowBlank: true, matches: /foo/});
      refute(doc._errors);

      AppVal.validators('inclusion')(doc,'state', {allowBlank: null, matches: /foo/});
      assert(doc._errors);
      assert.equals(doc._errors['state'],[['invalid_format']]);
    },

    "test matches": function () {
      var doc = {state: 'open'};
      AppVal.validators('inclusion')(doc,'state', {matches: /^ope/});
      refute(doc._errors);

      AppVal.validators('inclusion')(doc,'state', {matches: /^ope$/});
      assert(doc._errors);
      assert.equals(doc._errors['state'],[['invalid_format']]);
    },

    "test in list": function () {
      var doc = {state: 'open'};
      AppVal.validators('inclusion')(doc,'state', {in: ['open', 'closed']});
      refute(doc._errors);

      AppVal.validators('inclusion')(doc,'state', {in: ['OPEN', 'closed']});
      assert(doc._errors);
      assert.equals(doc._errors['state'],[['not_in_list']]);
    },
  });
})();
