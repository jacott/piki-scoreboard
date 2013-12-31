(function (test, v) {
  buster.testCase('models/server/org:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test authorize": function () {
      var org = TH.Factory.createOrg();
      var user = TH.Factory.createUser('su');

      refute.accessDenied(function () {
        org.authorize(user._id);
      });

      user = TH.Factory.createUser();

      assert.accessDenied(function () {
        org.authorize(user._id);
      });
    },
  });
})();
