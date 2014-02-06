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

    "test super user goes to system-setup": function () {
      TH.login(v.su);

      AppRoute.gotoPage(Bart.Profile);

      assert.dom('#SystemSetup');
    },
  });
})();
