(function (test, v) {
  buster.testCase('client/main:', {
    setUp: function () {
      test = this;
      v = {};
      test.stub(AppRoute, 'gotoPath');
      test.stub(Meteor, 'status').returns({connected: true});
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      App._startup();
      assert.select('head', function () {
        assert.select('title', 'Piki');
      });
      assert.select('body', function () {
        assert.select('body>header', function () {
          assert.select('button[name=signIn]');
        });
      });
    },

    "test autowired": function () {
      var queue = Meteor.startup.queue();
      assert.same(queue.length, 1);
      assert.same(queue[0], App._startup);
    },

    "test autorun": function () {
      var ready = TH.stubReady();

      v.arSpy = test.spy(Deps,'autorun');
      var userId = test.stub(App, 'userId').returns(null);
      var sub = test.stub(App, 'subscribe');
      App._startup();

      assert.calledWithExactly(AppRoute.gotoPath);
      assert.calledOnce(v.arSpy);
      assert.calledOnceWith(sub, 'Session');

      assert.isFunction(v.callback = sub.args[0][1]);

      v.callback('err');

      refute.called(ready.notifyReady);

      v.callback();

      assert.calledOnce(ready.notifyReady);

      assert.called(Meteor.status);
    },
  });
})();
