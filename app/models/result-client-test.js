define((require, exports, module)=>{
  const session         = require('koru/session');
  const TH              = require('test-helper');

  const {stub, spy, onEnd} = TH;

  const Result = require('./result');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("setScore number", ()=>{
      TH.login();
      var result = TH.Factory.createResult({scores: [1]});

      var rpc = spy(session._rpcs, 'Result.setScore');

      result.setScore(1, '23.5+');

      assert.calledWith(rpc, result._id, 1, '23.5+');

      rpc.reset();

      result.$reload().setScore(1, '23.5+'); // setting again
      refute.msg('should not update').called(rpc);
    });

    test("setScore time", ()=>{
      TH.login();
      var result = TH.Factory.createResult({scores: [1]});

      var rpc = spy(session._rpcs, 'Result.setScore');

      result.setScore(99, '1:02');

      assert.calledWith(rpc, result._id, 99, '1:02');

      rpc.reset();

      result.$reload().setScore(99, '1:02'); // setting again
      refute.msg('should not update').called(rpc);
    });

    group("setBoulderScore", ()=>{
      let result, rpc;
      beforeEach(()=>{
        TH.login();
        TH.Factory.createCategory({type: 'B'});
        result = TH.Factory.createResult({scores: [1]});

        rpc = spy(session._rpcs, 'Result.setBoulderScore');
      });

      test("dnc", ()=>{
        result.setBoulderScore(1, 2, "dnc");
        assert.calledWith(rpc, result._id, 1, 2, "dnc");

        rpc.reset();

        result.$reload().setBoulderScore(1, 2, "dnc"); // setting again
        refute.msg('should not update').called(rpc);
      });

      test("clear", ()=>{
        result.setBoulderScore(1, 2);
        assert.calledWith(rpc, result._id, 1);

        rpc.reset();

        result.$reload().setBoulderScore(1, 2); // setting again
        refute.msg('should not update').called(rpc);
      });

      test("set attempts", ()=>{
        result.setBoulderScore(1, 2, 3, 4);

        assert.calledWith(rpc, result._id, 1, 2, 3, 4);

        rpc.reset();

        result.$reload().setBoulderScore(1, 2, 3, 4); // setting again
        refute.msg('should not update').called(rpc);
      });
    });

    test("index", ()=>{
      var result = TH.Factory.createResult();

      assert.equals(Result.eventCatIndex.lookup({
        event_id: result.event_id,
        category_id: result.category_id,
        climber_id: result.climber_id,
      }), result._id);
    });
  });
});
