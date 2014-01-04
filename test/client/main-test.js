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
             assert.same(Bart.getCtx(this).data.link, Bart.Main);
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
      assert.select('#OrgHomeLink', v.org.name);
      assert.className(document.body, 'inOrg');

      assert.same(AppRoute._onGotoPath('/xxFOO/bar'), '/xxFOO/bar');

      assert.called(v.stopStub);

      assert.same(Bart.Main.id, null);
      assert.select('#OrgHomeLink', "Choose Organization");
      refute.className(document.body, 'inOrg');
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

    "test autorun with org": function () {
      var org = TH.Factory.createOrg({shortName: 'FOO'});
      var subStub = test.stub(App, 'subscribe');
      var sessSub = subStub.withArgs('Session');
      var orgSub = subStub.withArgs('Org').returns({stop: v.stopStub = test.stub()});
      var ready = TH.stubReady();

      v.arSpy = test.spy(Deps,'autorun');
      var userId = test.stub(App, 'userId').returns(null);


      AppRoute._onGotoPath('/FOO');
      orgSub.reset();

      App._startup();

      assert.calledOnce(sessSub);
      refute.called(orgSub);

      assert.isFunction(v.callback = sessSub.args[0][1]);

      v.callback();

      assert.calledOnce(ready.notifyReady);

      assert.called(Meteor.status);
      assert.calledWith(orgSub, 'Org', 'FOO');
    },

    "test autorun no org": function () {
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
