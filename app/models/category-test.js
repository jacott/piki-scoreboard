define((require, exports, module)=>{
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Category = require('./category');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("creation", ()=>{
      const category = Factory.createCategory();

      assert(Category.exists(category._id));

      assert(category.org);
    });

    test("standard validators", ()=>{
      const validators = Category._fieldValidators;

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
    });

  });
});
