(function (test, v) {
  buster.testCase('models/club:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test standard validators': function () {
      var validators = AppModel.Club._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.shortName, {maxLength: [4], required: [true], trim: [true], normalize: ['upcase']});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Club);
    },
  });
})();