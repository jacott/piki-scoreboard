(function (test, v) {
  buster.testCase('models/category:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test creation': function () {
      var category=TH.Factory.createCategory();

      assert(AppModel.Category.exists(category._id));

      assert(category.org);
    },

    'test standard validators': function () {
      var validators = AppModel.Category._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.group, {maxLength: [30], required: [true], trim: [true]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.shortName, {maxLength: [4], required: [true], trim: [true],
                                               normalize: ['upcase']});
      assert.validators(validators.minAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.maxAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.heatFormat, {inclusion: [{matches: /^(F\d+){1,3}Q{0,3}$/}]});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Category);
    },
  });
})();
