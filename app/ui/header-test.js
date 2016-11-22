isClient && define(function (require, exports, module) {
  var test, v;
  const koru     = require('koru');
  const Dom      = require('koru/dom');
  const Route    = require('koru/ui/route');
  const Event    = require('models/event');
  const Series   = require('models/series');
  const EventTpl = require('ui/event');
  const sut      = require('./header');
  const TH       = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      sut.show();
      test.stub(Route, 'gotoPath');
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test event in menu"() {
      const series = TH.Factory.createSeries();
      const event = EventTpl.event = TH.Factory.createEvent({series_id: series._id});

      TH.selectMenu('#Header [name=menu]', `/event/${event._id}/show`, function () {
        assert.equals(this.textContent, event.displayName);
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `/event/${event._id}/show`);

    },

    "test Calendar"() {
      TH.selectMenu('#Header [name=menu]', `/event`, function () {
        assert.equals(this.textContent, 'Calendar');
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `/event`);
    },

    "test Change org"() {
      TH.selectMenu('#Header [name=menu]', `/choose-org`, function () {
        assert.equals(this.textContent, 'Go to another org');
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `/choose-org`);
    },

    "test Help"() {
      TH.selectMenu('#Header [name=menu]', `/help`, function () {
        assert.equals(this.textContent, 'Help');
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `/help`);
    },

    "test sign in"() {
      TH.loginAs(TH.Factory.createUser('guest'));

      TH.selectMenu('#Header [name=menu]', `/sign-in`, function () {
        assert.equals(this.textContent, 'Sign in');
        assert.dom(this.parentNode, function () {
          refute.dom('li', 'Sign out');
        });
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `/sign-in`);
    },

    "test sign out, profile, settings"() {
      TH.login();
      TH.stubProperty(Route, 'currentPageRoute', {value: {orgSN: 'CNZ'}});

      TH.selectMenu('#Header [name=menu]', `/sign-out`, function () {
        assert.equals(this.textContent, 'Sign out');
        assert.dom(this.parentNode, function () {
          refute.dom('li', 'Sign in');
          assert.dom('li', 'Profile', {data: TH.match.field('id', '/profile')});
          assert.dom('li', 'CNZ settings', {data: TH.match.field('id', '/org-settings')});
        });
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `/sign-out`);
    },
  });
});
