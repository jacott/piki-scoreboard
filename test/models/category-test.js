(function (test, v) {
  buster.testCase('models/category:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    'test creation': function () {
      var category=TH.Factory.createCategory();

      assert(AppModel.Category.exists(category._id));

      assert(category.org);
    },

    'test standard validators': function () {
      var validators = AppModel.Category._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.group, {maxLength: [30], required: [true], trim: [true]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.shortName, {maxLength: [4], required: [true], trim: [true],
                                               normalize: ['upcase']});
      assert.validators(validators.minAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
      assert.validators(validators.maxAge, {number: [{integer: true, $gt: 0, $lt: 100}]});
    },

    "validate heats": {
      setUp: function () {
        v.cat = TH.Factory.buildCategory({heats: undefined});
      },

      "test bad format": function () {
        v.cat.heats = [{id: '123', name: 'round 1', extra: 'hello'}];

        refute(v.cat.$isValid());

        assert.modelErrors(v.cat, {heats: 'is_invalid'});
      },

      "test id is not string": function () {
        v.cat.heats = [{id: 123, name: 'round 1'}];

        refute(v.cat.$isValid());

        assert.modelErrors(v.cat, {heats: 'is_invalid'});
      },

      "test name is not string": function () {
        v.cat.heats = [{id: "123", name: {}}];

        refute(v.cat.$isValid());

        assert.modelErrors(v.cat, {heats: 'is_invalid'});
      },

      "test name too long": function () {
        v.cat.heats = [{id: "123", name: new Array(32).join('x')}];

        refute(v.cat.$isValid());

        assert.modelErrors(v.cat, {heats: 'is_invalid'});
      },

      "test id too long": function () {
        v.cat.heats = [{id: new Array(32).join('x'), name: 'x'}];

        refute(v.cat.$isValid());

        assert.modelErrors(v.cat, {heats: 'is_invalid'});
      },

      "test success": function () {
        v.cat.heats = [{id: '123', name: 'round 1'}];

        assert(v.cat.$isValid(), TH.showErrors(v.cat));
      },


    },

    "test removeRpc": function () {
      TH.assertRemoveRpc(AppModel.Category);
    },
  });
})();
