(function (test, v) {
  buster.testCase('models/event:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test creation': function () {
      var event=TH.Factory.createEvent();

      assert(AppModel.Event.exists(event._id));

      assert(event.org);
    },

    'test standard validators': function () {
      var validators = AppModel.Event._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Event);
    },
  });
})();
