(function (test, v) {
  buster.testCase('models/client/result:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test setScore number": function () {
      TH.login();
      var result = TH.Factory.createResult({scores: [1]});

      test.spy(App, 'rpc');

      result.setScore(1, '23.5+');

      assert.calledWith(App.rpc, 'Result.setScore', result._id, 1, '23.5+');

      App.rpc.reset();

      result.$reload().setScore(1, '23.5+'); // setting again
      refute.msg('should not update').called(App.rpc);
    },

    "test setScore time": function () {
      TH.login();
      var result = TH.Factory.createResult({scores: [1]});

      test.spy(App, 'rpc');

      result.setScore(99, '1:02');

      assert.calledWith(App.rpc, 'Result.setScore', result._id, 99, '1:02');

      App.rpc.reset();

      result.$reload().setScore(99, '1:02'); // setting again
      refute.msg('should not update').called(App.rpc);
    },

    "test setBoulderScore": function () {
      TH.login();
      var category = TH.Factory.createCategory({type: 'B'});
      var result = TH.Factory.createResult({scores: [1]});

      test.spy(App, 'rpc');

      result.setBoulderScore(1, 2, 3, 4);

      assert.calledWith(App.rpc, 'Result.setBoulderScore', result._id, 1, 2, 3, 4);

      App.rpc.reset();

      result.$reload().setBoulderScore(1, 2, 3, 4); // setting again
      refute.msg('should not update').called(App.rpc);
    },

    "test index": function () {
      var result = TH.Factory.createResult();

      assert.equals(AppModel.Result.eventCatIndex({
        event_id: result.event_id,
        category_id: result.category_id,
        climber_id: result.climber_id,
      }), result._id);
    },
  });
})();
