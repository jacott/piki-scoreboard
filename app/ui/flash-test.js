isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var Dom = require('koru/dom');
  var Flash = require('./flash');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      Dom.removeId('Flash');
      v = null;
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
