(function (test, v) {
  buster.testCase('lib/observable:', {
    setUp: function () {
      test = this;
      v = {};
      v.foo = App.makeSubject({}, 'onFoo', 'notify');
    },

    tearDown: function () {
      v = null;
    },

    "test observing": function () {
      v.foo.onFoo(v.stub1 = test.stub());
      var handle = v.foo.onFoo(v.stub2 = test.stub());
      v.foo.onFoo(v.stub3 = test.stub());

      handle.stop();

      v.foo.notify(123, 'bar');

      assert.calledWith(v.stub1, 123, 'bar');
      refute.called(v.stub2);
      assert.calledWith(v.stub3, 123);

      assert.same(v.stub1.thisValues[0], v.foo);
    },
  });
})();