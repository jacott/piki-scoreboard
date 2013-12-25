(function (test, v) {
  buster.testCase('client/system-setup:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test onEntry": function () {
      Bart.SystemSetup.onEntry();

      assert.select('#SystemSetup', function () {
        assert.select('.menu', function () {
          assert.select('[name=addOrg]');
        });
      });
    },
  });
})();
