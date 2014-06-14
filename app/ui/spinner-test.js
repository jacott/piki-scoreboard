isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var session = require('koru/session');
  var Spinner = require('./spinner');
  var Dom = require('koru/dom');
  var sync = require('koru/session/sync');

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
      test.stub(sync, 'onChange').returns({stop: v.stop = test.stub()});
      test.stub(window, 'addEventListener');
      test.stub(window, 'removeEventListener');

      Spinner.init();

      assert.called(sync.onChange);
      assert.calledWith(window.addEventListener, 'beforeunload');

      sync.onChange.yield(true);

      assert.dom('#Spinner.show');

      sync.onChange.yield(false);

      assert.dom('#Spinner:not(.show)');

      test.stub(sync, 'waiting').returns(true);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, "You have unsaved changes.");

      sync.waiting.restore();
      test.stub(sync, 'waiting').returns(false);

      window.addEventListener.yield(v.ev = {});

      assert.same(v.ev.returnValue, undefined);

      Spinner.stop();

      assert.called(v.stop);

      assert.called(window.removeEventListener);
    },
  });
});
