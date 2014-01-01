(function (test, v) {
  buster.testCase('server/publish-all-orgs:', {
    setUp: function () {
      test = this;
      v = {};
      v.user = TH.Factory.createUser('su');
      v.org = TH.Factory.createOrg();
      v.sub = TH.subStub(v.user._id);
      v.pub = TH.getPublish('AllOrgs');
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
        test.spy(v.sess, 'addObserver');
      },

      "test observes org": function () {
        var spyOrg = test.spy(AppModel.Org, 'observeAny');
        v.pub.call(v.tsub);

        assert.called(spyOrg);
        assert.calledWith(v.sess.addObserver, 'AllOrgs', spyOrg.returnValues[0]);

        assert.called(v.tsub.ready);
        assert(v.tsub.stopFunc);


        assert.calledWith(v.sub.aSpy, 'Org', v.org._id);

        v.tsub.stopFunc();

        assert.calledWith(v.sub.rSpy, 'Org', v.org._id);
      },
    },
  });
})();
