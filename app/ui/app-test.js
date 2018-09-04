isClient && define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const localStorage    = require('koru/local-storage');
  const session         = require('koru/session');
  const publish         = require('koru/session/publish');
  const Route           = require('koru/ui/route');
  const Factory         = require('test/factory');
  const Event           = require('ui/event');
  const EventTpl        = require('ui/event');
  const TH              = require('ui/test-helper');
  const App             = require('./app');

  const {stub, spy, onEnd} = TH;

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      stub(Route, 'replacePath');
      stub(window, 'addEventListener');
      stub(session, 'sendP');
      v.subSelf = spy(session, 'interceptSubscribe').withArgs('Self');
      TH.loginAs(TH.Factory.createUser('guest'));
    });

    afterEach(()=>{
      App.stop();
      TH.tearDown();
      v = {};
    });

    test("guest", ()=>{
      App.setAccess();
      assert.dom('body.isGuest');

      TH.user.restore();
      App.setAccess();
      assert.dom('body:not(.isGuest)');

      const judge = TH.Factory.createUser({role: 'j'});

      TH.loginAs(judge);
      App.setAccess();
      assert.dom('body:not(.isGuest)');
    });

    test("Org", ()=>{
      refute(App.org());

      var org = TH.Factory.createOrg();
      App.orgId = org._id;

      assert.same(App.org(), org);
    });

    test("me", ()=>{
      TH.user.restore();
      var user = TH.Factory.createUser();

      refute(App.me());

      koru.util.thread.userId = user._id;

      assert.same(App.me(), user);
    });

    test("rendering", ()=>{
      TH.loginAs(TH.Factory.createUser('guest'));
      App.start();

      assert.dom('body.readOnlyAccess', function () {
        assert.dom('body>header', function () {
          assert.dom('button[name=menu]');
        });
      });
    });

    test("popstate", ()=>{
      stub(Route, 'pageChanged');

      App.start();

      var sub = v.subSelf.args(0, 1);

      sub.callback();

      assert.calledOnceWith(window.addEventListener, 'popstate');
      window.addEventListener.args(0, 1)();

      assert.calledWithExactly(Route.pageChanged);
    });

    test("uses localStorage orgSN", ()=>{
      localStorage.setItem('orgSN', 'FUZ');
      stub(publish._pubs, 'Org');
      Route.replacePath.restore();
      stub(koru, 'getLocation').returns({pathname: '/'});
      stub(App, 'subscribe');

      const selfSub = App.subscribe.withArgs('Self').returns({waiting: true, stop: stub()});
      const orgSub = App.subscribe.withArgs('Org');

      App.start();

      selfSub.yield();

      v.org = TH.Factory.createOrg({shortName: 'FUZ'});

      assert.calledWith(orgSub, 'Org');
      orgSub.yield();

      assert.same(App.orgId, v.org._id);

      assert.same(Route.currentPage, Route.root.defaultPage);
    });

    test("Route.root.onBaseEntry", ()=>{
      assert.same(Route.root.routeVar, 'orgSN');
      assert.same(Route.root.async, true);
      stub (App, 'subscribe');

      const selfSub = App.subscribe.withArgs('Self').returns({stop: stub()});
      const orgSub = App.subscribe.withArgs('Org');

      App.start();
      selfSub.yield();

      /** test diff orgSN */
      Route.root.onBaseEntry('x', {orgSN: 'org2'}, v.callback = stub());
      refute.called(v.callback);
      assert.calledWith(App.subscribe, 'Org', 'org2');

      Factory.createOrg({shortName: 'org2'});
      orgSub.yield();
      assert.called(v.callback);
    });

    test("subscribing to Org", ()=>{
      stub(publish._pubs, 'Org');
      Route.replacePath.restore();
      stub(koru, 'getLocation').returns({pathname: '/FOO'});

      stub(App, 'subscribe');
      v.subSelf = App.subscribe.withArgs('Self').returns({stop() {}});
      v.subOrg = App.subscribe.withArgs('Org').returns({stop: v.orgStop = stub()});

      assert.same(Route.root.routeVar, 'orgSN');

      App.start();

      assert.called(v.subSelf);
      v.subSelf.yield();

      assert.called(v.subOrg);

      // simulate org added by subscribe
      v.org = TH.Factory.createOrg({shortName: 'FOO'});
      Dom.ctxById('Header').updateAllTags();
      v.subOrg.yield();

      assert.same(App.orgId, v.org._id);
      assert.equals(App.org().attributes, v.org.attributes);

      assert.dom('#Event');
      assert.className(document.body, 'inOrg');

      assert.same(localStorage.getItem('orgSN'), 'FOO');

      localStorage.setItem('orgSN', '');

      Route.root.onBaseEntry(null, {}, v.callback = stub());

      assert.called(v.orgStop);

      assert.same(App.orgId, null);
      assert.called(v.callback);
      refute.className(document.body, 'inOrg');
    });
  });
});
