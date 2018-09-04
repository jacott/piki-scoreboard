define((require, exports, module)=>{
  const TH              = require('test-helper');

  const Team = require('./team');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("creation", ()=>{
      const team=TH.Factory.createTeam();

      assert(team.teamType);
      assert(team.shortName);
      assert(team.org);
    });

    test("standard validators", ()=>{
      const validators = Team._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.shortName, {
        maxLength: [5], required: [true], trim: [true], unique: [{scope: ['org_id', 'teamType_id']}]});
      assert.validators(validators.teamType_id, {required: [true]});
    });
  });
});
