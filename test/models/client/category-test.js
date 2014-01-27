(function (test, v) {
  buster.testCase('models/client/category:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test groupApplicable": function () {
      var gB1 = TH.Factory.createCategory({group: 'B'});
      var gA1 = TH.Factory.createCategory({group: 'A'});
      var gA2 = TH.Factory.createCategory({group: 'A'});

      var climber = TH.Factory.createClimber();

      TH.Factory.createOrg();

      var other = TH.Factory.createCategory({group: 'A'});

      var result = {A: [], B: []};

      AppModel.Category.groupApplicable(climber, function (group, docs) {
        result[group].push(Apputil.mapField(docs));
      });

      assert.equals(result, {A: [[gA1._id, gA2._id]], B: [[gB1._id]]});

    },
  });
})();
