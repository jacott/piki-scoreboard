isClient && define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const localStorage    = require('koru/local-storage');
  const Subscription    = require('koru/pubsub/subscription');
  const SubscriptionSession = require('koru/pubsub/subscription-session');
  const session         = require('koru/session');
  const Route           = require('koru/ui/route');
  const OrgSub          = require('pubsub/org-sub');
  const SelfSub         = require('pubsub/self-sub');
  const Factory         = require('test/factory');
  const Event           = require('ui/event');
  const EventTpl        = require('ui/event');
  const TH              = require('ui/test-helper');
  const App             = require('./app');

  const {private$} = require('koru/symbols');

  const {stub, spy, onEnd, match: m} = TH;

  const {connected$} = SubscriptionSession[private$];

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let ssConnect;
    beforeEach(()=>{
      stub(Route, 'replacePath');
      stub(window, 'addEventListener');
      ssConnect = stub(SubscriptionSession.prototype, 'connect');
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

      let selfSub;
      assert.calledWith(ssConnect, m(v => (selfSub = v) instanceof SelfSub));
      selfSub[connected$]({});

      assert.calledOnceWith(window.addEventListener, 'popstate');
      window.addEventListener.args(0, 1)({state: 12});

      assert.calledWithExactly(Route.pageChanged, 12);
    });

    test("uses localStorage orgSN", ()=>{
      localStorage.setItem('orgSN', 'FUZ');
      Route.replacePath.restore();
      stub(koru, 'getLocation').returns({pathname: '/'});

      App.start();

      let selfSub;
      assert.calledWith(ssConnect, m(v => (selfSub = v) instanceof SelfSub));
      ssConnect.reset();
      v.org = TH.Factory.createOrg({shortName: 'FUZ'});
      selfSub[connected$]({});

      let orgSub;
      assert.calledWith(ssConnect, m(v => (orgSub = v) instanceof OrgSub));

      orgSub[connected$]({});

      assert.same(App.orgId, v.org._id);

      assert.same(Route.currentPage, Route.root.defaultPage);
    });

    test("Route.root.onBaseEntry", ()=>{
      assert.same(Route.root.routeVar, 'orgSN');
      assert.same(Route.root.async, true);

      App.start();
      let selfSub;
      assert.calledWith(ssConnect, m(v => (selfSub = v) instanceof SelfSub));
      ssConnect.reset();
      const org2 = Factory.createOrg({shortName: 'org2'});
      selfSub[connected$]({});

      /** test diff orgSN */
      Route.root.onBaseEntry('x', {orgSN: 'org2'}, v.callback = stub());
      refute.called(v.callback);
      let orgSub;
      assert.calledWith(ssConnect, m(v => (orgSub = v) instanceof OrgSub));
      assert.equals(orgSub.args, org2._id);

      orgSub[connected$]({});
      assert.called(v.callback);
    });

    test("subscribing to Org", ()=>{
      Route.replacePath.restore();
      stub(koru, 'getLocation').returns({pathname: '/FOO'});

      assert.same(Route.root.routeVar, 'orgSN');

      App.start();

      let selfSub;
      assert.calledWith(ssConnect, m(v => (selfSub = v) instanceof SelfSub));
      ssConnect.reset();
      const org = TH.Factory.createOrg({shortName: 'FOO'});
      selfSub[connected$]({});

      let orgSub;
      assert.calledWith(ssConnect, m(v => (orgSub = v) instanceof OrgSub));

      // simulate org added by subscribe
      Dom.ctxById('Header').updateAllTags();
      orgSub[connected$]({});

      assert.same(App.orgId, org._id);
      assert.equals(App.org().attributes, org.attributes);

      assert.dom('#Event');
      assert.className(document.body, 'inOrg');

      assert.same(localStorage.getItem('orgSN'), 'FOO');

      localStorage.setItem('orgSN', '');

      spy(orgSub, 'stop');

      Route.root.onBaseEntry(null, {}, v.callback = stub());

      assert.called(orgSub.stop);

      assert.same(App.orgId, null);
      assert.called(v.callback);
      refute.className(document.body, 'inOrg');
    });
  });
});
