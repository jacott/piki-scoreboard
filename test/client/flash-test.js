(function (test, v) {
  buster.testCase('client/flash:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
      Bart.removeId('Flash');
    },

    "test loading": function () {
      Bart.Flash.loading();

      assert.dom('#Flash.loading>.m', 'Loading...');
    },

    "test error": function () {
      Bart.Flash.error('how now brown cow');

      assert.dom('#Flash.error>.m', 'how now brown cow');

      Bart.Flash.error('new message');

      assert.same(document.getElementsByClassName('error').length, 1);

      TH.click('#Flash.error>.m');

      refute.dom('#Flash');
    },
  });
})();
