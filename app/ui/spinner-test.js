isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var session = require('koru/session');
  var Spinner = require('./spinner');
  var Dom = require('koru/dom');
  var sessState = require('koru/session/state');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};

      document.body.appendChild(Dom.html({id: 'Spinner'}));
    },

    tearDown: function () {
      Spinner.stop();
      TH.tearDown();
      v = null;
    },

    "test init": function () {
      test.stub(sessState.pending, 'onChange').returns({stop: v.stop = test.stub()});
      test.stub(window, 'addEventListener');
      test.stub(window, 'removeEventListener');

      Spinner.init();

      assert.called(sessState.pending.onChange);
      assert.calledWith(window.addEventListener, 'beforeunload');

      sessState.pending.onChange.yield(true);

      assert.dom('#Spinner.show');

      sessState.pending.onChange.yield(false);

      assert.dom('#Spinner:not(.show)');

      test.stub(session, 'isRpcPending').returns(true);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, "You have unsaved changes.");

      session.isRpcPending.restore();
      test.stub(session, 'isRpcPending').returns(false);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, undefined);

      Spinner.stop();

      assert.called(v.stop);

      assert.called(window.removeEventListener);
    },
  });
});
