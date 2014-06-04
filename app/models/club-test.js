define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Club = require('./club');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test creation': function () {
      var club=TH.Factory.createClub();

      assert(Club.exists(club._id));

      assert(club.org);
    },

    'test standard validators': function () {
      var validators = Club._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true],
        unique: [{scope: 'org_id'}],
      });
      assert.validators(validators.shortName, {
        maxLength: [10], required: [true], trim: [true],
        normalize: ['upcase'],
        unique: [{scope: 'org_id'}],
      });
    },
  });
});
