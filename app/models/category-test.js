define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Category = require('./category');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test creation': function () {
      var category=TH.Factory.createCategory();

      assert(Category.exists(category._id));

      assert(category.org);
    },

    'test standard validators': function () {
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
        matches: /^Q{0,3}(:\d+)?(F\d+(:\d+)?){1,3}$/,
      }]});
    },

  });
});
