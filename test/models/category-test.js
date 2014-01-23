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
      assert.validators(validators.shortName, {maxLength: [4], required: [true], trim: [true],
                                               normalize: ['upcase']});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Category);
    },
  });
})();
