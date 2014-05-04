// Client only
Meteor.isClient && (function (test, v) {
  buster.testCase('packages/bart/test/window-resize:', {
    setUp: function () {
      test = this;
      v = {};
      test.stub(window, 'addEventListener');
      test.stub(window, 'removeEventListener');
      test.stub(App, 'setTimeout').returns("st123");
      test.stub(App, 'clearTimeout');
    },

    tearDown: function () {
      v = null;
    },

    "test observing": function () {
      var handle = Bart.onWindowResize(v.cb = test.stub());
      var handle2 = Bart.onWindowResize(v.cb2 = test.stub());

      assert.calledOnceWith(window.addEventListener, 'resize');

      var caller = window.addEventListener.args[0][1];

      caller();
      assert.calledOnce(App.setTimeout);

      caller();
      assert.calledOnce(App.setTimeout);

      App.setTimeout.yield();

      assert.calledOnce(v.cb);
      assert.calledOnce(v.cb2);

      App.setTimeout.reset();
      caller();
      assert.calledOnceWith(App.setTimeout, sinon.match.func, 100);

      App.setTimeout.yield();

      assert.calledTwice(v.cb);
      assert.calledTwice(v.cb2);

      v.cb.reset();
      v.cb2.reset();

      handle.stop();

      refute.called(window.removeEventListener);

      App.setTimeout.reset();
      caller();
      assert.calledOnce(App.setTimeout);

      refute.called(App.clearTimeout);

      handle2.stop();

      assert.calledOnceWith(window.removeEventListener, 'resize', caller);

      assert.calledWith(App.clearTimeout, 'st123');

      refute.called(v.cb);
      refute.called(v.cb2);
    },
  });
})();
