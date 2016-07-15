isClient && define(function (require, exports, module) {
  var test, v;
  const koru  = require('koru');
  const Dom   = require('koru/dom');
  const Flash = require('./flash');
  const TH    = require('./test-helper');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
      Dom.removeId('Flash');
    },

    "test click close": function () {
      Flash.notice('click to close');

      test.spy(Dom, 'hideAndRemove');

      assert.dom('#Flash', function () {
        TH.click('.m');
        assert.calledWith(Dom.hideAndRemove, this);
      });
    },

    "test close after seven seconds": function () {
      test.stub(koru, 'afTimeout');

      Flash.notice('7 seconds to go');

      assert.calledWith(koru.afTimeout, TH.match.func, 7000);

      test.spy(Dom, 'hideAndRemove');

      assert.dom('#Flash', function () {
        koru.afTimeout.yield();
        assert.calledWith(Dom.hideAndRemove, this);
      });
    },

    "test loading": function () {
      Flash.loading();

      assert.dom('#Flash.loading>.m', 'Loading...');
    },

    "test error": function () {
      Flash.error('how now brown cow');

      assert.dom('#Flash.error>.m', 'how now brown cow');

      Flash.error('new message');

      assert.same(document.getElementsByClassName('error').length, 1);

      TH.click('#Flash.error>.m');

      refute.dom('#Flash');
    },
  });
});
