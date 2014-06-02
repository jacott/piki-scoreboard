isClient && define(function (require, exports, module) {
  var test, v;
  var TH      = require('ui/test-helper');
  var Route   = require('koru/ui/route');
  var App     = require('app');
  var Dom     = require('koru/dom');
  var Spinner = require('ui/spinner');
  var sut     = require('./client-startup');
  var session = require('koru/session');
  var subscribe = require('koru/session/subscribe');
  var env = require('koru/env');
  var publish = require('koru/session/publish');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      test.stub(Route, 'replacePath');
      test.stub(window, 'addEventListener');
      test.stub(Spinner, 'init');
      test.stub(session, 'sendP');
      v.subSelf = test.stub(subscribe, 'intercept').withArgs('Self');
    },

    "test inits spinner": function () {
      sut.start();

      assert.called(Spinner.init);
    },

    tearDown: function () {
      sut.stop();
      TH.tearDown();
      v = null;
    },

    "test rendering": function () {
      sut.start();

      assert.dom('body.readOnlyAccess', function () {
        assert.dom('body>header', function () {
          assert.dom('button#OrgHomeLink', "Choose Organization", function () {
             assert.same(Dom.getCtx(this).data.link, Dom.Home);
          });
          assert.dom('button[name=signIn]');
        });
      });
    },

    "test popstate": function () {
      test.stub(Route, 'pageChanged');

      sut.start();

      refute.called(window.addEventListener);

      var sub = v.subSelf.args[0][1];

      sub.callback();

      assert.calledOnceWith(window.addEventListener, 'popstate');
      window.addEventListener.getCall(0).yield();

      assert.calledWithExactly(Route.pageChanged);
    },

    "test subscribing to Org": function () {
      test.stub(publish._pubs, 'Org');
      Route.replacePath.restore();
      test.stub(env, 'getLocation').returns({pathname: '/FOO'});

      v.subOrg = subscribe.intercept.withArgs('Org');

      assert.same(Route.root.routeVar, 'orgSN');

      sut.start();

      assert.called(v.subSelf);
      refute.called(v.subOrg);
      v.subSelf.args[0][1].callback();

      assert.called(v.subOrg);

      // simulate org added by subscribe
      v.org = TH.Factory.createOrg({shortName: 'FOO'});
      Dom.getCtxById('Header').updateAllTags();
      v.subOrg.args[0][1].callback();

      assert.same(App.orgId, v.org._id);
      assert.equals(App.org().attributes, v.org.attributes);

      assert.dom('#OrgHomeLink', v.org.name);
      assert.className(document.body, 'inOrg');

      v.stopStub = test.stub(v.subOrg.args[0][1], 'stop');

      Route.root.onBaseEntry(null, {});

      assert.called(v.stopStub);

      assert.same(App.orgId, null);
      assert.dom('#OrgHomeLink', "Choose Organization");
      refute.className(document.body, 'inOrg');
    },
  });
});
