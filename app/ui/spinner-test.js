isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var session = require('koru/session');
  var Spinner = require('./spinner');
  var Dom = require('koru/dom');

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
      test.stub(session.rpc, 'onChange').returns({stop: v.stop = test.stub()});
      test.stub(window, 'addEventListener');
      test.stub(window, 'removeEventListener');

      Spinner.init();

      assert.called(session.rpc.onChange);
      assert.calledWith(window.addEventListener, 'beforeunload');

      session.rpc.onChange.yield(true);

      assert.dom('#Spinner.show');

      session.rpc.onChange.yield(false);

      assert.dom('#Spinner:not(.show)');

      test.stub(session.rpc, 'waiting').returns(true);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, "You have unsaved changes.");

      session.rpc.waiting.restore();
      test.stub(session.rpc, 'waiting').returns(false);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, undefined);

      Spinner.stop();

      assert.called(v.stop);

      assert.called(window.removeEventListener);
    },
  });
});
