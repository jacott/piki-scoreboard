(function (test, v) {
  buster.testCase('server/publish-su:', {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser('su', {org_id: v.org._id});
      v.otherUser = TH.Factory.createUser({org_id: v.org._id});
      v.sub = TH.subStub(v.user._id);
      v.pub = TH.getPublish('SU');
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

      "test org already observed": function () {
        v.sess.orgId = v.org._id;
        v.sub.aSpy.reset();

        v.pub.call(v.tsub);

        refute.calledWith(v.sub.aSpy, 'Org');

        v.tsub.stopFunc();

        refute.calledWith(v.sub.rSpy, 'Org');
      },

      "test observes users": function () {
        test.spy(v.sess, 'onOrgChange');

        var spyUsers = test.spy(AppModel.User, 'observeOrg_id');
        v.pub.call(v.tsub);

        refute.called(spyUsers);
        v.sub.aSpy.reset();


        //// Change Org

        v.sess.notifyOrgChange(v.sess.orgId = v.org._id);

        assert.calledWith(spyUsers, v.org._id);
        var stopFunc = spyUsers.returnValues[0];
        assert.called(v.sess.addObserver, 'OrgUsers', stopFunc);

        assert.calledWith(v.sub.aSpy, 'User', v.otherUser._id);

        var org = TH.Factory.createOrg();
        var user = TH.Factory.createUser({org_id: org._id});


        //// Change Org again

        test.spy(stopFunc, 'stop');

        v.sub.aSpy.reset();

        v.sess.notifyOrgChange(v.sess.orgId = org._id);

        assert.called(stopFunc.stop);
        assert.calledWith(v.sub.aSpy, 'User', user._id);


        assert.calledWith(v.sub.rSpy, 'User', v.otherUser._id);
        refute.calledWith(v.sub.rSpy, 'User', v.user._id);


        //// Stop subscription

        v.sub.rSpy.reset();

        v.tsub.stopFunc();

        assert.calledWith(v.sub.rSpy, 'User', user._id);


         //// Change Org again

        v.sess.addObserver.reset();

        v.sess.notifyOrgChange(v.sess.orgId = v.org._id);

        refute.called(v.sess.addObserver);

      },

      "test switching to null Org from already selected": function () {
        v.sess.notifyOrgChange(v.sess.orgId = v.org._id);

        v.pub.call(v.tsub);

        assert.calledWith(v.sub.aSpy, 'User', v.otherUser._id);

        test.spy(v.sess, 'removeObserver');
        var spyUsers = test.spy(AppModel.User, 'observeOrg_id');

        v.sess.notifyOrgChange(v.sess.orgId = null);

        assert.calledWith(v.sess.removeObserver, 'OrgUsers');
        refute.called(spyUsers);
      },

    },
  });
})();
