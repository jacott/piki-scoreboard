define(function (require, exports, module) {
  var test, v;
  const session = require('koru/session');
  const TH      = require('test-helper');
  const Result  = require('./result');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test setScore number"() {
      TH.login();
      var result = TH.Factory.createResult({scores: [1]});

      var rpc = test.spy(session._rpcs, 'Result.setScore');

      result.setScore(1, '23.5+');

      assert.calledWith(rpc, result._id, 1, '23.5+');

      rpc.reset();

      result.$reload().setScore(1, '23.5+'); // setting again
      refute.msg('should not update').called(rpc);
    },

    "test setScore time"() {
      TH.login();
      var result = TH.Factory.createResult({scores: [1]});

      var rpc = test.spy(session._rpcs, 'Result.setScore');

      result.setScore(99, '1:02');

      assert.calledWith(rpc, result._id, 99, '1:02');

      rpc.reset();

      result.$reload().setScore(99, '1:02'); // setting again
      refute.msg('should not update').called(rpc);
    },

    "setBoulderScore": {
      setUp() {
        TH.login();
        TH.Factory.createCategory({type: 'B'});
        v.result = TH.Factory.createResult({scores: [1]});

        v.rpc = test.spy(session._rpcs, 'Result.setBoulderScore');
      },

      "test dnc"() {
        v.result.setBoulderScore(1, 2, "dnc");
        assert.calledWith(v.rpc, v.result._id, 1, 2, "dnc");

        v.rpc.reset();

        v.result.$reload().setBoulderScore(1, 2, "dnc"); // setting again
        refute.msg('should not update').called(v.rpc);
      },

      "test clear"() {
        v.result.setBoulderScore(1, 2);
        assert.calledWith(v.rpc, v.result._id, 1);

        v.rpc.reset();

        v.result.$reload().setBoulderScore(1, 2); // setting again
        refute.msg('should not update').called(v.rpc);
      },

      "test set attempts"() {
        v.result.setBoulderScore(1, 2, 3, 4);

        assert.calledWith(v.rpc, v.result._id, 1, 2, 3, 4);

        v.rpc.reset();

        v.result.$reload().setBoulderScore(1, 2, 3, 4); // setting again
        refute.msg('should not update').called(v.rpc);
      },
    },

    "test index"() {
      var result = TH.Factory.createResult();

      assert.equals(Result.eventCatIndex({
        event_id: result.event_id,
        category_id: result.category_id,
        climber_id: result.climber_id,
      }), result._id);
    },
  });
});
