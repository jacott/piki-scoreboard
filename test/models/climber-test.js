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

      assert(climber.club);
      assert(climber.org);
    },

    'test standard validators': function () {
      var validators = AppModel.Climber._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.gender, {required: [true], inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Climber);
    },
  });
})();
