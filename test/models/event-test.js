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

    "competitor registration": {
      setUp: function () {
        v.cat1 = TH.Factory.createCategory({_id: 'cat1', type: 'L', heatFormat: 'F8QQ'});
        v.cat2 = TH.Factory.createCategory({_id: 'cat2', type: 'B', heatFormat: 'F8F26QQ'});
        v.event = TH.Factory.createEvent({heats: undefined});
      },

      "test new category": function () {
        var result = TH.Factory.buildResult({category_id: v.cat1._id});
        result.$$save();
        assert.equals(v.event.$reload().heats, {cat1: 'LF8QQ'});

        var result = TH.Factory.buildResult({category_id: v.cat2._id});
        result.$$save();
        assert.equals(v.event.$reload().heats, {cat1: 'LF8QQ', cat2: 'BF8F26QQ'});
      },

      "test no more in category": function () {
        var results = [1,2].map(function () {
          var result = TH.Factory.buildResult({category_id: v.cat1._id});
          result.$$save();
          return result;
        });

        results[0].$remove();
        assert.equals(v.event.$reload().heats, {cat1: 'LF8QQ'});

        results[1].$remove();
        assert.equals(v.event.$reload().heats, {});
      },
    },
  });
})();
