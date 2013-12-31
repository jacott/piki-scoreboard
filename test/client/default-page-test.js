(function (test, v) {
  buster.testCase('client/default-page:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppRoute.gotoPage();
      App.isReady = false;
      v = null;
    },

    "test listens for ready": function () {
      var user = TH.Factory.createUser('su');
      TH.loginAs(user);

      var ready = TH.stubReady();

      AppRoute.gotoPath('/');

      refute.select('#SystemSetup');

      assert.calledOnce(ready.onReady);

      ready.onReady.args[0][0]();
      assert.select('#SystemSetup');
    },


    "test super user": function () {
      var user = TH.Factory.createUser('su');
      TH.loginAs(user);

      var ready = TH.stubReady();

      ready.onReady.yields();
      AppRoute.gotoPath('/');

      assert.select('#SystemSetup');
    },
  });
})();
