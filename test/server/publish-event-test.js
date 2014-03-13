(function (test, v) {
  var children = ['Competitor', 'Result'];

  buster.testCase('server/publish-event:', {
    setUp: function () {
      test = this;

      TH.stubOplog();
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser('su');
      v.otherUser = TH.Factory.createUser();

      v.cm = {};
      children.forEach(function (modelName) {
        v.cm[modelName] = TH.Factory['create' + modelName]();
      });

      v.sub = TH.subStub(v.user._id);
      v.pub = TH.getPublish('Event');
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
        test.spy(global, 'check');

        var spys = children.map(function (modelName) {
          return test.spy(AppModel[modelName], 'observeEvent_id');
        });

        v.pub.call(v.tsub, v.event._id);

        assert.calledWith(check, v.event._id, String);

        spys.forEach(function (spy) {
          assert.calledWith(spy, v.event._id);
        });

        assert.called(v.tsub.ready);
        assert(v.tsub.stopFunc);

        children.forEach(function (modelName) {
          assert.calledWith(v.sub.sendSpy, {msg: 'added', collection: modelName,
                                            id: v.cm[modelName]._id, fields: v.cm[modelName].attributes});
        });

        v.tsub.stopFunc();

        children.forEach(function (modelName) {
          assert.calledWith(v.sub.sendSpy, {msg: 'removed', collection: modelName,
                                            id: v.cm[modelName]._id});
        });
      },
    },
  });
})();
