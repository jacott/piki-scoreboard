(function (test, v) {
  buster.testCase('client/org:', {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg({shortName: 'FOO'});
      v.subStub = test.stub(App, 'subscribe').withArgs('Org').returns({stop: v.stopStub = test.stub()});
      TH.stubReady().onReady.yields();
      document.body.appendChild(Bart.Main.$render({}));
    },

    tearDown: function () {
      AppRoute.gotoPage();
      Bart.Org.id = null;
      v = null;
    },

    "test onEntry onExit": function () {
      AppRoute.gotoPath('/FOO');

      assert.called(v.subStub);

      assert.select('#Org');

      v.subStub.yield();

      assert.same(Bart.Org.id, v.org._id);
      assert.select('#header [name=connect]', v.org.name);

      Bart.Org.onBaseExit();

      refute.select('#Org');
      assert.called(v.stopStub);
    },

  });
})();
