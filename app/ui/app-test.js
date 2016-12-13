isClient && define(function (require, exports, module) {
  var test, v;
  const koru         = require('koru');
  const Dom          = require('koru/dom');
  const localStorage = require('koru/local-storage');
  const session      = require('koru/session');
  const publish      = require('koru/session/publish');
  const Route        = require('koru/ui/route');
  const Factory      = require('test/factory');
  const Event        = require('ui/event');
  const EventTpl     = require('ui/event');
  const Spinner      = require('ui/spinner');
  const TH           = require('ui/test-helper');
  const App          = require('./app');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      test.stub(Route, 'replacePath');
      test.stub(window, 'addEventListener');
      test.stub(Spinner, 'init');
      test.stub(session, 'sendP');
      v.subSelf = test.spy(session, 'interceptSubscribe').withArgs('Self');
      TH.loginAs(TH.Factory.createUser('guest'));
    },

    tearDown() {
      App.stop();
      TH.tearDown();
      v = null;
    },

    "test inits spinner"() {
      App.start();
      assert.called(Spinner.init);
    },

    "test Org"() {
      refute(App.org());

      var org = TH.Factory.createOrg();
      App.orgId = org._id;

      assert.same(App.org(), org);
    },

    "test me"() {
      TH.user.restore();
      var user = TH.Factory.createUser();

      refute(App.me());

      koru.util.thread.userId = user._id;

      assert.same(App.me(), user);
    },

    "test rendering"() {
      TH.loginAs(TH.Factory.createUser('guest'));
      App.start();

      assert.dom('body.readOnlyAccess', function () {
        assert.dom('body>header', function () {
          assert.dom('button[name=menu]');
        });
      });
    },

    "test popstate"() {
      test.stub(Route, 'pageChanged');

      App.start();

      var sub = v.subSelf.args(0, 1);

      sub.callback();

      assert.calledOnceWith(window.addEventListener, 'popstate');
      window.addEventListener.args(0, 1)();

      assert.calledWithExactly(Route.pageChanged);
    },

    "test uses localStorage orgSN"() {
      localStorage.setItem('orgSN', 'FUZ');
      test.stub(publish._pubs, 'Org');
      Route.replacePath.restore();
      test.stub(koru, 'getLocation').returns({pathname: '/'});
      test.stub (App, 'subscribe');

      const selfSub = App.subscribe.withArgs('Self').returns({waiting: true, stop: this.stub()});
      const orgSub = App.subscribe.withArgs('Org');

      App.start();

      selfSub.yield();

      v.org = TH.Factory.createOrg({shortName: 'FUZ'});

      assert.calledWith(orgSub, 'Org');
      orgSub.yield();

      assert.same(App.orgId, v.org._id);

      assert.same(Route.currentPage, Route.root.defaultPage);
    },

    "test Route.root.onBaseEntry"() {
      assert.same(Route.root.routeVar, 'orgSN');
      assert.same(Route.root.async, true);
      test.stub (App, 'subscribe');

      const selfSub = App.subscribe.withArgs('Self').returns({stop: this.stub()});
      const orgSub = App.subscribe.withArgs('Org');

      App.start();
      selfSub.yield();

      /** test diff orgSN */
      Route.root.onBaseEntry('x', {orgSN: 'org2'}, v.callback = test.stub());
      refute.called(v.callback);
      assert.calledWith(App.subscribe, 'Org', 'org2');

      Factory.createOrg({shortName: 'org2'});
      orgSub.yield();
      assert.called(v.callback);
    },

    "test subscribing to Org"() {
      test.stub(publish._pubs, 'Org');
      Route.replacePath.restore();
      test.stub(koru, 'getLocation').returns({pathname: '/FOO'});

      this.stub(App, 'subscribe');
      v.subSelf = App.subscribe.withArgs('Self').returns({stop() {}});
      v.subOrg = App.subscribe.withArgs('Org').returns({stop: v.orgStop = this.stub()});

      assert.same(Route.root.routeVar, 'orgSN');

      App.start();

      assert.called(v.subSelf);
      v.subSelf.yield();

      assert.called(v.subOrg);

      // simulate org added by subscribe
      v.org = TH.Factory.createOrg({shortName: 'FOO'});
      Dom.getCtxById('Header').updateAllTags();
      v.subOrg.yield();

      assert.same(App.orgId, v.org._id);
      assert.equals(App.org().attributes, v.org.attributes);

      assert.dom('#Event');
      assert.className(document.body, 'inOrg');

      assert.same(localStorage.getItem('orgSN'), 'FOO');

      localStorage.setItem('orgSN', '');

      Route.root.onBaseEntry(null, {}, v.callback = this.stub());

      assert.called(v.orgStop);

      assert.same(App.orgId, null);
      assert.called(v.callback);
      refute.className(document.body, 'inOrg');
    },
  });
});
