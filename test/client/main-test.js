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
          assert.select('button#OrgHomeLink', "Choose Organization", function () {
             assert.same(Bart.getCtx(this).data.link, '/org/choose');
          });
          assert.select('button[name=signIn]');
        });
      });
    },

    "test autowired": function () {
      var queue = Meteor.startup.queue();
      assert.same(queue.length, 1);
      assert.same(queue[0], App._startup);
    },

    "test subscribing to Org": function () {
      document.body.appendChild(Bart.Main.Header.$render({}));
      v.org = TH.Factory.createOrg({shortName: 'FOO'});
      v.subStub = test.stub(App, 'subscribe').withArgs('Org').returns({stop: v.stopStub = test.stub()});

      assert.same(AppRoute._onGotoPath('/FOO/bar'), 'bar');

      v.subStub.yield();

      assert.same(Bart.Main.id, v.org._id);
      assert.select('#OrgHomeLink', v.org.name, function () {
        assert.same(Bart.getCtx(this).data.link, '/FOO');
      });

      assert.same(AppRoute._onGotoPath('/xxFOO/bar'), '/xxFOO/bar');

      assert.called(v.stopStub);

      assert.same(Bart.Main.id, null);
      assert.select('#OrgHomeLink', "Choose Organization", function () {
        assert.same(Bart.getCtx(this).data.link, '/org/choose');
      });
    },

    "test whenReady": function () {
      var ready = TH.stubReady();
      ready.onReady.returns({stop: v.stopStub = test.stub()});

      App._startup();

      assert.calledTwice(ready.onReady);

      assert.isFalse(ready.onReady.args[0][0]());

      assert.calledWith(AppRoute.gotoPath, document.location);
      assert.called(v.stopStub);
    },

    "test autorun": function () {
      var ready = TH.stubReady();

      v.arSpy = test.spy(Deps,'autorun');
      var userId = test.stub(App, 'userId').returns(null);
      var sub = test.stub(App, 'subscribe');


      App._startup();


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
