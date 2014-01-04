(function (test, v) {
  buster.testCase('server/publish-org:', {
    setUp: function () {
      test = this;
      v = {};
      v.user = TH.Factory.createUser('su');
      v.org = TH.Factory.createOrg();
      v.sub = TH.subStub(v.user._id);
      v.pub = TH.getPublish('Org');
      v.tsub = TH.subStub(v.user._id, v.sub);

      TH.loginAs(v.user);
    },

    tearDown: function () {
      v.sub.stopFunc && v.sub.stopFunc();
      v = null;
    },

    "test not subscribed": function () {
      assert.accessDenied(function () {
        v.pub.call(v.tsub);
      });
    },


    "with Session": {
      setUp: function () {
        v.sess = new Session(v.sub);
        v.sess.onOrgChange(v.orgChange = test.stub());
        test.spy(v.sess, 'addObserver');
      },

      "test observes org": function () {
        var spyOrg = test.spy(AppModel.Org, 'observeId');
        test.spy(global, 'check');
        v.pub.call(v.tsub, v.org.shortName);

        assert.calledWith(check, v.org.shortName, String);
        assert.called(spyOrg);
        var orgStopHandle = spyOrg.returnValues[0];
        assert.calledWith(v.sess.addObserver, 'Org', orgStopHandle);

        assert.called(v.tsub.ready);
        assert(v.tsub.stopFunc);

        assert.calledWith(v.orgChange, v.org._id);

        assert.calledWith(v.sub.aSpy, 'Org', v.org._id);


        test.spy(orgStopHandle, 'stop');

        v.tsub.stopFunc();

        assert.called(orgStopHandle.stop);

        assert.calledWith(v.sub.rSpy, 'Org', v.org._id);

        assert.calledWith(v.orgChange, null);
      },

      "test allOrgs subscribed": function () {
        v.sess.observers.AllOrgs = {stop: function () {}};

        v.sub.aSpy.reset();

        v.pub.call(v.tsub, v.org.shortName);

        assert.same(v.sess.orgId, v.org._id);

        refute.called(v.sub.aSpy);

        v.tsub.stopFunc();

        refute.called(v.sub.rSpy);
      },
    },
  });
})();
