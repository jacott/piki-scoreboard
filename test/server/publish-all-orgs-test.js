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
      v.sess = Session.get(v.sub);
    },

    tearDown: function () {
      v.sess.release();
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

      assert.calledWith(v.sub.sendSpy, {msg: 'added', collection: 'Org', id: v.org._id, fields: v.org.attributes});
    },
  });
})();
