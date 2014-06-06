define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Category = require('./category');
  var util = require('koru/util');
  var Climber = require('./climber');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
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

      Category.groupApplicable(climber, function (group, docs) {
        result[group].push(util.mapField(docs));
      });

      assert.equals(result, {A: [[gA1._id, gA2._id]], B: [[gB1._id]]});

    },

  });
});
