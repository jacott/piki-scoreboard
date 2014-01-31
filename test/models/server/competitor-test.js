(function (test, v) {
  buster.testCase('models/server/competitor:', {
    setUp: function () {
      test = this;
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser();
    },

    tearDown: function () {
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oEvent = TH.Factory.createEvent();
        var oUser = TH.Factory.createUser();

        var competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(function () {
          competitor.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        test.spy(global, 'check');
        var competitor = TH.Factory.buildCompetitor();

        refute.accessDenied(function () {
          competitor.authorize(v.user._id);
        });

        assert.calledWith(check, v.event._id, String);
      },
    },
  });
})();
