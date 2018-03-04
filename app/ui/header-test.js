isClient && define(function (require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const session         = require('koru/session');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const ClientLogin     = require('koru/user-account/client-login');
  const Event           = require('models/event');
  const Series          = require('models/series');
  const Factory         = require('test/factory');
  const App             = require('ui/app');
  const EventTpl        = require('ui/event');
  const SystemSetupTpl  = require('ui/system-setup');
  const TeamTpl         = require('ui/team');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd, stubProperty} = TH;

  const sut      = require('./header');

  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {};
      sut.show();
      stub(Route, 'gotoPath');
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test observe user"() {
      const org = Factory.createOrg();
      const guest = Factory.createUser('guest');
      const judge = Factory.createUser('judge');
      const admin = Factory.createUser('admin');

      App.orgId = org._id;

      ClientLogin.setUserId(session, guest._id);
      ClientLogin.ready(session);

      Route.replacePage(TeamTpl);
      spy(Route, 'replacePage');

      assert.equals(document.body.className.split(' ').sort(), ['isGuest', 'readOnlyAccess']);

      refute.called(Route.replacePage);



      ClientLogin.setUserId(session, judge._id);
      ClientLogin.ready(session);
      assert.equals(document.body.className.split(' ').sort(), ['jAccess', 'pAccess']);
      assert.calledWith(Route.replacePage, TeamTpl.Index);

      Route.replacePage.reset();
      ClientLogin.setUserId(session, admin._id);
      ClientLogin.ready(session);
      assert.equals(document.body.className.split(' ').sort(), ['aAccess', 'jAccess', 'pAccess']);
      assert.calledWith(Route.replacePage, TeamTpl.Index);

      Route.replacePage();
      Route.replacePage.reset();

      ClientLogin.setUserId(session, judge._id);
      ClientLogin.ready(session);
      assert.same(document.body.className, 'readOnlyAccess');
      refute.called(Route.replacePage);
    },

    "test event in menu"() {
      const series = Factory.createSeries();
      const event = EventTpl.event = Factory.createEvent({series_id: series._id});

      TH.selectMenu('#Header [name=menu]', `event/${event._id}/show`, function () {
        assert.equals(this.textContent, event.displayName);
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `event/${event._id}/show`);
    },

    "test system-setup in menu"() {
      TH.click('#Header [name=menu]');
      assert.dom('#SelectMenu', elm => {refute.dom('li', 'Org settings')});
      Dom.remove(Dom('.glassPane'));

      /** logging in is not good enough **/
      const admin = Factory.createUser('admin'); // not yet admin
      TH.loginAs(admin);
      TH.click('#Header [name=menu]');

      assert.dom('#SelectMenu', elm => {refute.dom('li', 'Org settings')});
      Dom.remove(Dom('.glassPane'));

      /** need to be on org's own site  **/
      const series = Factory.createSeries();
      const event = EventTpl.event = Factory.createEvent({series_id: series._id});
      Route.gotoPage(TeamTpl, {orgSN: admin.org.shortName});

      TH.click('#Header [name=menu]');
      assert.dom('#SelectMenu', elm => {
        TH.click('li', 'Org settings');
      });

      assert.calledWith(Route.gotoPath, 'system-setup');

      Dom.remove(Dom('.glassPane'));

      /** judge is not good enough **/
      const judge = Factory.createUser('judge');
      TH.loginAs(judge);

      TH.click('#Header [name=menu]');
      assert.dom('#SelectMenu', elm => {
        refute.dom('li', 'Org settings');
      });
    },

    "test Calendar"() {
      TH.selectMenu('#Header [name=menu]', `event`, function () {
        assert.equals(this.textContent, 'Calendar');
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `event`);
    },

    "test Change org"() {
      TH.selectMenu('#Header [name=menu]', `choose-org`, function () {
        assert.equals(this.textContent, 'Go to another org');
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `choose-org`);
    },

    "test Help"() {
      TH.selectMenu('#Header [name=menu]', `$help`, function () {
        assert.equals(this.textContent, 'Help');
        TH.click(this);
      });

      assert.dom('.Dialog #Help');
    },

    "test sign in"() {
      TH.loginAs(Factory.createUser('guest'));

      TH.selectMenu('#Header [name=menu]', `sign-in`, function () {
        assert.equals(this.textContent, 'Sign in');
        TH.click(this);
      });

      assert.calledWith(Route.gotoPath, `sign-in`);
    },

    "test settings"() {
      TH.selectMenu('#Header [name=menu]', 'climber', function () {
        assert.dom(this.parentNode, elm => {
          assert.dom('li', matchId('category'));
          assert.dom('li', matchId('team'));
        });
      });
    },

    "test sign out"() {
      TH.login();
      stubProperty(Route, 'currentPageRoute', {value: {orgSN: 'CNZ'}});
      stub(UserAccount, 'logout');

      TH.selectMenu('#Header [name=menu]', '$help', function () {
        assert.dom(this.parentNode, elm => refute.dom('li', 'Sign in'));
      });
      Dom.remove(Dom('.glassPane'));

      TH.selectMenu('#Header [name=avatar]', `$signOut`, function () {
        assert.equals(this.textContent, 'Sign out');
        assert.dom(this.parentNode, elm => {
          assert.dom('li', 'Profile', matchId('profile'));
        });
        TH.click(this);
      });

      assert.called(UserAccount.logout);

      stub(UserAccount, 'logoutOtherClients');
      TH.selectMenu('[name=avatar]', '$signOutOther');

      assert.calledWith(UserAccount.logoutOtherClients, TH.match.func);
      UserAccount.logoutOtherClients.yield('my error');

      assert.dom('#Flash .error', 'Unexpected error.');

      UserAccount.logoutOtherClients.yield();

      assert.dom('#Flash .notice', 'You have been signed out of any other sessions.');
    },
  });

  function matchId(id) {return {data: TH.match.field('_id', id)}}
});
