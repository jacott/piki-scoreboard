define(function (require, exports, module) {
  const TH       = require('test-helper');

  const Category = require('./category');
  var test, v;

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    'test creation'() {
      var category=TH.Factory.createCategory();

      assert(Category.exists(category._id));

      assert(category.org);
    },

    'test standard validators'() {
      var validators = Category._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.group, {maxLength: [30], required: [true], trim: [true]});
      assert.validators(validators.type, {inclusion: [{matches: /^[BL]$/ }]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.shortName, {maxLength: [10], required: [true], trim: [true],
                                               normalize: ['upcase']});
      assert.validators(validators.minAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.maxAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.heatFormat, {inclusion: [{
        matches: TH.match(x => x.toString() === /^Q{0,10}(:\d+)?(F\d+(:\d+)?){0,3}$/.toString()),
      }]});
    },

  });
});
