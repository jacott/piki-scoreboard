(function () {
  var doc;

  buster.testCase('packages/app-models/validators/required-validator:', {
    setUp: function () {
      doc = {exists: 'a', empty: ''};
    },

    tearDown: function () {
    },

    "test 1": function () {
      doc = {};
      AppVal.validators('required')(doc,'foo', 1);
      assert(doc._errors);
      assert.equals(doc._errors['foo'],[['is_required']]);

      doc = {foo: []};
      AppVal.validators('required')(doc,'foo', 1);
      assert(doc._errors);
      assert.equals(doc._errors['foo'],[['is_required']]);

      doc = {foo: ['baz']};
      AppVal.validators('required')(doc,'foo', 1);
      refute(doc._errors);

      doc = {foo: ['baz', 'bar']};
      AppVal.validators('required')(doc,'foo', 1);
      refute(doc._errors);
    },

    'test false': function () {
      doc = {foo: false};
      AppVal.validators('required')(doc,'foo', 'not_null');
      refute(doc._errors);
    },

    'test missing': function () {
      AppVal.validators('required')(doc,'name');

      assert(doc._errors);
      assert.equals(doc._errors['name'],[['is_required']]);
    },

    'test not_null': function () {
      AppVal.validators('required')(doc,'empty','not_null');
      refute(doc._errors);

      AppVal.validators('required')(doc,'undef','not_null');
      assert(doc._errors);
    },

    'test exists': function () {
      AppVal.validators('required')(doc,'exists');

      refute(doc._errors);
    },

    'test empty': function () {
      AppVal.validators('required')(doc,'empty');

      assert(doc._errors);
      assert.equals(doc._errors['empty'],[['is_required']]);
    },
  });
})();
