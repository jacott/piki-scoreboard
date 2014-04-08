(function (test, v) {
  buster.testCase('packages/app-models/test/rpc:', {
    setUp: function () {
      test = this;
      v = {};
      App.rpc._private.setCount(0);
    },

    tearDown: function () {
      v = null;
    },

    "test rpc": function () {
      test.stub(Meteor, 'call');

      var handle = App.rpc.onChange(v.ob = test.stub());
      test.onEnd(function () {
        handle.stop();
      });

      App.rpc('abc', 1, 2, v.abcCallback = test.stub());

      assert.calledWith(Meteor.call, 'abc', 1, 2, sinon.match.func);

      assert.calledOnceWith(v.ob, true);

      App.rpc('def', v.defCallback = test.stub());

      assert.same(App.rpc.count, 2);

      assert.calledOnce(v.ob);
      v.ob.reset();

      Meteor.call.args[0][3]();

      refute.called(v.ob);

      Meteor.call.args[1][1]('err', 'result');

      assert.calledWith(v.ob, false);

      assert.called(v.abcCallback);
      assert.calledWith(v.defCallback, 'err', 'result');
    },
  });
})();
