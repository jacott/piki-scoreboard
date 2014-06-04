define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Climber = require('./climber');
  var util = require('koru/util');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test search": function () {
      var names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
      });

      assert.equals(Climber.search('berty'), []);

      assert.equals(util.mapField(Climber.search('e'), 'name'),
                    ['brendon', 'robert']);

      assert.equals(util.mapField(Climber.search('bo'), 'name'),
                    ['Bob', 'bobby']);

      assert.equals(util.mapField(Climber.search('b'), 'name'),
                    ['Bob', 'bobby', 'brendon', 'robert']);

      assert.equals(util.mapField(Climber.search('b',2), 'name'),
                    ['Bob', 'brendon']);

      assert.equals(
        util.mapField(Climber.search('b',2, function (climber) {
          return climber.name !== 'Bob';
        }), 'name'),
        ['bobby', 'brendon']);
    },
  });
});
