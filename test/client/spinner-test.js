(function (test, v) {
  buster.testCase('client/spinner:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test init": function () {
      test.stub(App.rpc, 'onChange');
      test.stub(window, 'addEventListener');

      Bart.Spinner.init();

      assert.called(App.rpc.onChange);
      assert.calledWith(window.addEventListener, 'beforeunload');

      App.rpc.onChange.yield(true);

      assert.dom('#Spinner.show>i');

      App.rpc.onChange.yield(false);

      assert.dom('#Spinner:not(.show)');

      App.rpc._private.setCount(1);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, "You have unsaved changes.");

      App.rpc._private.setCount(0);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, undefined);
    },
  });
})();
