(function (test, v) {
  buster.testCase('models/client/climber:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },


    "test search": function () {
      var names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
      });

      assert.equals(AppModel.Climber.search('berty'), []);

      assert.equals(Apputil.mapField(AppModel.Climber.search('e'), 'name'),
                    ['brendon', 'robert']);

      assert.equals(Apputil.mapField(AppModel.Climber.search('bo'), 'name'),
                    ['Bob', 'bobby']);

      assert.equals(Apputil.mapField(AppModel.Climber.search('b'), 'name'),
                    ['Bob', 'bobby', 'brendon', 'robert']);

      assert.equals(Apputil.mapField(AppModel.Climber.search('b',2), 'name'),
                    ['Bob', 'brendon']);

    },
  });
})();
