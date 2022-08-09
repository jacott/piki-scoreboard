define((require, exports, module) => {
  const TH              = require('koru/model/test-db-helper');
  const Factory         = require('test/factory');

  const {error$} = require('koru/symbols');

  const {stub, spy, onEnd, util} = TH;

  const Org = require('./org');

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test}) => {
    beforeEach(async () => {
      await TH.startTransaction();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    test('creation', async () => {
      const org = await Factory.createOrg();
      assert(await Org.exists(org._id));
    });

    test('standard validators', () => {
      const validators = Org._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [true]});

      assert.validators(validators.shortName, {
        maxLength: [10], required: [true], trim: [true], unique: [true]});
    });
  });
});
