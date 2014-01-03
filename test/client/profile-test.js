(function (test, v) {
  buster.testCase('client/profile:', {
    setUp: function () {
      test = this;
      v = {};
      v.su = TH.Factory.createUser('su');
    },

    tearDown: function () {
      v = null;
    },
  });
})();
