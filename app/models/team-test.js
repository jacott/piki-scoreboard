//;no-client-async
define((require, exports, module) => {
  const TH              = require('koru/model/test-db-helper');
  const Factory         = require('test/factory');

  const Team = require('./team');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(async () => {
      await TH.startTransaction();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    test('creation', async () => {
      const team = await Factory.createTeam();

      assert(team.teamType);
      assert(team.shortName);
      assert(team.org);
    });

    test('standard validators', () => {
      const validators = Team._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.shortName, {
        maxLength: [5], required: [true], trim: [true], unique: [{scope: ['org_id', 'teamType_id']}]});
      assert.validators(validators.teamType_id, {required: [true]});
    });
  });
});
