(function (test, v) {
  buster.testCase('models/server/category:', {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
    },

    tearDown: function () {
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var climber = TH.Factory.buildClimber();

        assert.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var climber = TH.Factory.buildClimber();

        refute.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },
    },
  });
})();
