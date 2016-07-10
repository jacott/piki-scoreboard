define(function (require, exports, module) {
  var test, v;
  const TH      = require('test-helper');
  const Climber = require('./climber');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    'test creation'() {
      var climber=TH.Factory.createClimber({team_ids: ['tm1']});

      assert(Climber.exists(climber._id));

      assert.same(climber.number, 1);

      assert.equals(climber.team_ids, ['tm1']);
      assert(climber.org);
    },

    'test standard validators'() {
      var validators = Climber._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.dateOfBirth, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    },
  });
});
