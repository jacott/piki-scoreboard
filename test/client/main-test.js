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
      assert.same(AppRoute.title, 'Piki');

      assert.dom('head', function () {
        assert.dom('title', 'Piki');
      });
      assert.dom('body', function () {
        assert.dom('body>header', function () {
          assert.dom('button#OrgHomeLink', "Choose Organization", function () {
             assert.same(Bart.getCtx(this).data.link, Bart.Home);
          });
          assert.dom('button[name=signIn]');
        });
      });
    },

    "test autowired": function () {
      var queue = Meteor.startup.queue();
      assert.same(queue.length, 2);
      assert.same(queue[1], App._startup);
    },

    "test popstate": function () {
      test.stub(window, 'addEventListener');
      test.stub(AppRoute, 'pageChanged');

      App._startup();

      assert.calledOnceWith(window.addEventListener, 'popstate');
      App.Ready.isReady = true;
      window.addEventListener.getCall(0).yield();

      assert.calledWithExactly(AppRoute.pageChanged);
    },

    "test subscribing to Org": function () {
      App.Ready.isReady = true;
      document.body.appendChild(Bart.Main.Header.$render({}));
      v.org = TH.Factory.createOrg({shortName: 'FOO'});
      v.subStub = test.stub(App, 'subscribe').withArgs('Org').returns({stop: v.stopStub = test.stub()});


      assert.same(AppRoute.root.routeVar, 'orgSN');
      AppRoute.root.onBaseEntry(null, {orgSN: 'FOO'});

      assert.called(v.subStub);
      v.subStub.yield();

      assert.same(App.orgId, v.org._id);
      assert.equals(App.org().attributes, v.org.attributes);

      assert.dom('#OrgHomeLink', v.org.name);
      assert.className(document.body, 'inOrg');

      AppRoute.root.onBaseEntry(null, {});

      assert.called(v.stopStub);

      assert.same(App.orgId, null);
      assert.dom('#OrgHomeLink', "Choose Organization");
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


      AppRoute.root.onBaseEntry(null, {orgSN: 'FOO'});
      orgSub.reset();

      App._startup();

      assert.calledOnce(sessSub);
      refute.called(orgSub);

      assert.isFunction(v.callback = sessSub.args[0][1]);

      App.Ready.isReady = true;

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
