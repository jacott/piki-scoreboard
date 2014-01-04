(function (test, v) {
  buster.testCase('server/publish-all-orgs:', {
    setUp: function () {
      TH.stubOplog();
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser('su', {org_id: v.org._id});
      v.sub = TH.subStub(v.user._id);
      v.onStart = Session._private.observers()['on.start'];

      test.stub(v.onStart, 'AllOrgs');
      v.sess = new Session(v.sub);
    },

    tearDown: function () {
      v.sub && v.sub.stopFunc && v.sub.stopFunc();
      v = null;
    },

    "test observes org": function () {
      test.stub(v.sess, 'addObserver');
      var spyOrg = test.spy(AppModel.Org, 'observeAny');
      assert.calledWith(v.onStart.AllOrgs, v.sess);

      v.onStart.AllOrgs.restore();
      v.onStart.AllOrgs(v.sess);

      assert.called(spyOrg);
      assert.calledWith(v.sess.addObserver, 'AllOrgs', spyOrg.returnValues[0]);

      assert.calledWith(v.sub.aSpy, 'Org', v.org._id);
    },
  });
})();
