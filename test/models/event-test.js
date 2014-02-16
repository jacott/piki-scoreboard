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
        v.cat1 = TH.Factory.createCategory({_id: 'cat1', type: 'L', heatFormat: 'QQF8'});
        v.cat2 = TH.Factory.createCategory({_id: 'cat2', type: 'B', heatFormat: 'QQF26F8'});
        v.event = TH.Factory.createEvent({heats: undefined});
      },

      "test new category": function () {
        var result = TH.Factory.buildResult({category_id: v.cat1._id});
        result.$$save();
        assert.equals(v.event.$reload().heats, {cat1: 'LQQF8'});

        var result = TH.Factory.buildResult({category_id: v.cat2._id});
        result.$$save();
        assert.equals(v.event.$reload().heats, {cat1: 'LQQF8', cat2: 'BQQF26F8'});
      },

      "test no more in category": function () {
        var results = [1,2].map(function () {
          var result = TH.Factory.buildResult({category_id: v.cat1._id});
          result.$$save();
          return result;
        });

        results[0].$remove();
        assert.equals(v.event.$reload().heats, {cat1: 'LQQF8'});

        results[1].$remove();
        assert.equals(v.event.$reload().heats, {});
      },
    },
  });
})();
