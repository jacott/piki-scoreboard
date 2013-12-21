(function (test, v) {
  buster.testCase('server/session:', {
    setUp: function () {
      test = this;

      TH.stubOplog();
      v = {
        org: TH.Factory.createOrg(),
        user: TH.Factory.createUser({_id: 'uid1'}),
        sub: TH.subStub('uid1'),
        pub: TH.getPublish('Session'),
        userSpy: test.spy(AppModel.User, 'observeId'),
      };
    },

    tearDown: function () {
      AppOplog.stopAllObservers();
      v = null;
    },

    "test guest user": function () {
      v.sub.userId = null;

      v.pub.call(v.sub);
      var guestUser = AppModel.User.guestUser();
      assert.called(v.sub.aSpy, 'User', guestUser._id, guestUser.attributes);
    },

    // "test observing user change": function () {
    //   v.user.$update({organization_ids: ['123']});
    //   var handle = Session.observe('organization_ids', 'TestKey', v.changed = test.stub());
    //   test.onEnd(function () {handle.stop()});

    //   assert.same(Session._private.observers().organization_ids.TestKey, v.changed);

    //   v.pub.call(v.sub);

    //   var sess = Session.get(v.sub);

    //   assert.calledWith(v.changed, sess, ['123']);

    //   v.changed.reset();

    //   assert.calledOnceWith(v.userSpy, v.user._id, sinon.match(function (updates) {
    //     v.updates = updates;
    //     return true;
    //   }));

    //   v.updates.changed(v.user._id, {not_me: 'value'});
    //   refute.called(v.changed);

    //   v.updates.changed(v.user._id, {organization_ids: ['value']});

    //   assert.calledWith(v.changed, sess, ['value']);
    // },

    "test init and stop": function () {
      assert.same(v.pub.call(v.sub), undefined);

      assert.called(v.sub.ready);

      var sess = Session.get(v.sub);

      assert.calledOnceWith(v.userSpy, v.user._id);
      assert.calledWith(v.sub.aSpy, 'User', v.user._id, v.user.attributes);
      assert.attributesEqual(sess.user, v.user);

      assert.same(sess.user.attributes, AppModel.User.memFind('uid1'));

      v.sub.stopFunc();
      assert.equals(AppOplog.observers(),{});

      refute(AppModel.User.memFind('uid1'));
    },

    "with Session": {
      setUp: function () {
        v.pub.call(v.sub);

        v.sess = Session.get(v.sub);
      },

      "test memFind": function () {
        assert.same(v.sess.userId, v.user._id);
        assert.equals(AppModel.Org.memFind(v.org._id), v.org.attributes);
      },

      "test accessDenied": function () {
        v.sub.stopFunc();
        assert.accessDenied(function () {
          Session.get(v.sub);
        });
      },
    },
  });
})();
