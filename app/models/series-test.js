define((require, exports, module)=>{
  const TH              = require('test-helper');

  const Series = require('./series');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("standard validators", ()=>{
      const validators = Series._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.date, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.closed, {boolean: ['trueOnly']});
    });

    test("creation", ()=>{
      const teamType = TH.Factory.createTeamType({_id: 'tt1'});
      const series=TH.Factory.createSeries();

      assert(Series.exists(series._id));

      assert(series.org);
      assert.equals(series.teamType_ids, ['tt1']);
      assert.same(series.displayName, 'Series 1');
    });
  });
});
