define((require, exports, module)=>{
  const TH              = require('test-helper');
  const Factory         = require('test/factory');
  const Climber         = require('./climber');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("creation", ()=>{
      const climber = Factory.createClimber({team_ids: ['tm1']});

      assert(Climber.exists(climber._id));

      assert.same(climber.number, 1);

      assert.equals(climber.team_ids, ['tm1']);
      assert(climber.org);
    });

    test("standard validators", ()=>{
      const validators = Climber._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.dateOfBirth, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    });
  });
});
