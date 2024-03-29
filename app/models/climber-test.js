define((require, exports, module) => {
  const Climber         = require('./climber');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(async () => {
      await TH.startTransaction();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    test('creation', async () => {
      const climber = await Factory.createClimber({team_ids: ['tm1']});

      assert(await Climber.exists(climber._id));

      assert.same(climber.number, 1);

      assert.equals(climber.team_ids, ['tm1']);
      assert(climber.org);
    });

    test('standard validators', () => {
      const validators = Climber._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mfn]$/}]});
      assert.validators(validators.dateOfBirth, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/}]});
      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    });
  });
});
