(function (test, v) {
  buster.testCase('lib/client/bart-ext:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test updateOnCallback": function () {
      test.stub(Meteor, 'setTimeout').returns(123);
      test.stub(Meteor, 'clearTimeout');
      var ctx = {onDestroy: test.stub(), updateAllTags: test.stub()};
      var obFunc = test.stub().returns(v.stop = {stop: test.stub()});

      Bart.updateOnCallback(ctx, obFunc);
      assert.called(ctx.onDestroy);
      assert.called(obFunc);

      obFunc.yield();
      obFunc.yield();
      assert.calledOnce(Meteor.setTimeout);
      refute.called(ctx.updateAllTags);

      Meteor.setTimeout.yield();
      assert.calledOnce(ctx.updateAllTags);

      Meteor.setTimeout.reset();

      obFunc.yield();
      assert.calledOnce(Meteor.setTimeout);

      ctx.updateAllTags.reset();

      Meteor.setTimeout.yield();
      assert.calledOnce(ctx.updateAllTags);

      obFunc.yield();
      ctx.onDestroy.yield();
      assert.calledWith(Meteor.clearTimeout, 123);
      assert.called(v.stop.stop);
    },
  });
})();
