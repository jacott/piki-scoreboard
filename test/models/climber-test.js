(function (test, v) {
  buster.testCase('models/climber:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test creation': function () {
      var climber=TH.Factory.createClimber();

      assert(AppModel.Climber.exists(climber._id));

      assert.same(climber.number, 1);


      assert(climber.club);
      assert(climber.org);
    },

    'test standard validators': function () {
      var validators = AppModel.Climber._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{score: 'org_id'}]});
      assert.validators(validators.gender, {required: [true], inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.club_id, {required: [true]});
      assert.validators(validators.dateOfBirth, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Climber);
    },
  });
})();
