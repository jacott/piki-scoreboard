(function (test, v) {
  buster.testCase('packages/app-models/test/client/app:', {
    setUp: function () {
      test = this;
      v = {};
      v.globalErrorCatch = App.globalErrorCatch;
      App.globalErrorCatch = function () {};
    },

    tearDown: function () {
      App.globalErrorCatch = v.globalErrorCatch;
      v = null;
    },

    "test subscribe": function () {
      test.stub(Meteor, 'subscribe');

      App.subscribe('name', 1, 2, function (arg) {
        v.arg = arg;
      });

      assert.calledWithExactly(Meteor.subscribe, 'name', 1, 2, sinon.match(function (options) {
        v.options = options;
        return true;
      }));

      test.stub(App, 'globalErrorCatch');

      v.options.onError('err');

      assert.calledWithExactly(App.globalErrorCatch, 'err');
      assert.same(v.arg, 'err');


      App.globalErrorCatch.reset();

      v.options.onReady('xyz');

      refute.called(App.globalErrorCatch);
      assert.same(v.arg, 'xyz');
    },
  });
})();
