(function (test, v) {
  buster.testCase('models/club:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test creation': function () {
      var club=TH.Factory.createClub();

      assert(AppModel.Club.exists(club._id));

      assert(club.org);
    },

    'test standard validators': function () {
      var validators = AppModel.Club._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{score: 'org_id'}]});
      assert.validators(validators.shortName, {maxLength: [10], required: [true], trim: [true], normalize: ['upcase']});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Club);
    },
  });
})();
