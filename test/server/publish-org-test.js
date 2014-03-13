(function (test, v) {
  var orgChildren = ['Club', 'Climber', 'Event', 'Category'];

  buster.testCase('server/publish-org:', {
    setUp: function () {
      test = this;

      TH.stubOplog();
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser('su');
      v.otherUser = TH.Factory.createUser();

      v.cm = {};
      orgChildren.forEach(function (modelName) {
        v.cm[modelName] = TH.Factory['create' + modelName]();
      });

      v.sub = TH.subStub(v.user._id);
      v.pub = TH.getPublish('Org');
      v.tsub = TH.subStub(v.user._id, v.sub);

      TH.loginAs(v.user);
    },

    tearDown: function () {
      v.sub.stopFunc && v.sub.stopFunc();
      v = null;
    },

    "with Session": {
      setUp: function () {
        TH.getPublish('Session').call(v.sub);
        v.sess = Session._private.get(v.sub);
        test.spy(v.sess, 'addObserver');
        test.spy(v.sess, 'removeObserver');
        v.sub.sendSpy.reset();
      },

      "test observes org": function () {
        var spyUsers = test.spy(AppModel.User, 'observeOrg_id');

        var spys = orgChildren.map(function (modelName) {
          return test.spy(AppModel[modelName], 'observeOrg_id');
        });

        test.spy(global, 'check');

        v.pub.call(v.tsub, v.org.shortName);

        assert.calledWith(check, v.org.shortName, String);

        assert.calledWith(spyUsers, v.org._id);
        spys.forEach(function (spy) {
          assert.calledWith(spy, v.org._id);
        });
        var usersStopHandle = spyUsers.returnValues[0];
        assert.called(v.sess.addObserver, 'OrgUsers', usersStopHandle);

        assert.called(v.tsub.ready);
        assert(v.tsub.stopFunc);

        assert.calledWith(v.sub.sendSpy, {msg: 'added', collection: 'User',
                                          id: v.otherUser._id, fields: v.otherUser.attributes});
        refute.calledWith(v.sub.sendSpy, {msg: 'added', collection: 'User', id: v.user._id});

        orgChildren.forEach(function (modelName) {
          assert.calledWith(v.sub.sendSpy, {msg: 'added', collection: modelName,
                                            id: v.cm[modelName]._id, fields: v.cm[modelName].attributes});
        });

        test.spy(usersStopHandle, 'stop');

        v.tsub.stopFunc();

        assert.called(usersStopHandle.stop);

        assert.calledWith(v.sub.sendSpy, {msg: 'removed', collection: 'User', id: v.otherUser._id});
        refute.calledWith(v.sub.sendSpy, {msg: 'removed', collection: 'User', id: v.user._id});

        orgChildren.forEach(function (modelName) {
          assert.calledWith(v.sub.sendSpy, {msg: 'removed', collection: modelName, id: v.cm[modelName]._id});
        });
      },
    },
  });
})();
