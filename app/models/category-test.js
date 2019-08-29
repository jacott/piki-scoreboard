define((require, exports, module)=>{
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {error$} = require('koru/symbols');

  const {stub, spy, onEnd, match: m} = TH;

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
      assert.validators(validators.type, {inclusion: [{matches: /^[BLS]$/ }]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.shortName, {maxLength: [10], required: [true], trim: [true],
                                               normalize: ['upcase']});
      assert.validators(validators.minAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.maxAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.heatFormat, {validate: [m.func]});
    });

    test("heatFormat", ()=>{
      const cat = Factory.buildCategory({type: 'L'});

      const assertInvalid = (heatFormat, msg="is_invalid")=>{
        cat.heatFormat = heatFormat;

        refute(cat.$isValid());
        assert.equals(cat[error$], {heatFormat: [[msg]]});
      };

      const assertValid = (heatFormat)=>{
        cat.heatFormat = heatFormat;

        assert.elideFromStack.msg(TH.showErrors(cat))(cat.$isValid());
      };

      assertInvalid(null);
      assertInvalid('F2Q');
      assertValid('QQF8F4');

      cat.type = 'S';

      assertInvalid('QF2', 'not_allowed');
      assertValid('');
      assert.same(cat.heatFormat, undefined);

      assert.equals(cat.heatFormatRegex, m.equal(/^C?[1-4]*$/));
    });
  });
});
