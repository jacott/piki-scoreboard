(function (test, v) {
  buster.testCase('models/server/event:', {
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

        var event = TH.Factory.buildEvent();

        assert.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var event = TH.Factory.buildEvent();

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },
    },
  });
})();
