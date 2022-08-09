define((require, exports, module) => {
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const TeamType = require('./team-type');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('creation', async () => {
      const teamType = await Factory.createTeamType();

      assert(await TeamType.exists(teamType._id));
      assert(teamType.name);
      assert(teamType.org);
      assert.same(teamType.default, false);
    });

    test('standard validators', () => {
      const validators = TeamType._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
    });
  });
});
