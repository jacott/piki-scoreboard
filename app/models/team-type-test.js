define(function (require, exports, module) {
  var test, v;
  const TH       = require('test-helper');
  const TeamType = require('./team-type');

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
      const teamType=TH.Factory.createTeamType();

      assert(TeamType.exists(teamType._id));
      assert(teamType.name);
      assert(teamType.org);
      assert.same(teamType.default, false);

    },

    'test standard validators'() {
      const validators = TeamType._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
    },
  });
});
