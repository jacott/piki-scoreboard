define(function (require, exports, module) {
  var test, v;
  const TH      = require('test-helper');
//  const Team = require('./team');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    '//test creation'() {
      const team=TH.Factory.createTeam();

      assert(Team.exists(team._id));

      assert.same(team.number, 1);

      assert(team.club);
      assert(team.org);
    },

    '//test standard validators'() {
      const validators = Team._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.club_id, {required: [true]});
      assert.validators(validators.dateOfBirth, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    },
  });
});
