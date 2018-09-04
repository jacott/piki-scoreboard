define((require, exports, module)=>{
  const TH              = require('test-helper');

  const TeamType = require('./team-type');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("creation", ()=>{
      const teamType=TH.Factory.createTeamType();

      assert(TeamType.exists(teamType._id));
      assert(teamType.name);
      assert(teamType.org);
      assert.same(teamType.default, false);

    });

    test("standard validators", ()=>{
      const validators = TeamType._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
    });
  });
});
