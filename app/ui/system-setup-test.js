isClient && define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Session         = require('koru/session');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const Org             = require('models/org');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const App             = require('./app');
  const TH              = require('./test-helper');

  const {stub, spy, after} = TH;

  const SystemSetup = require('./system-setup');
  let v = {};

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v = {};
      App.orgId = Factory.createOrg({_id: 'org001'})._id;
      v.su = Factory.createUser('su');
      TH.loginAs(v.su);
      App.setAccess();
    });

    afterEach(()=>{
      TH.tearDown();
      v = null;
    });

    test("export data", ()=>{
      Route.gotoPage(SystemSetup);

      UserAccount.token = "userId123|token456";
      TH.stubProperty(Session, 'sessAuth', {value: "mySessAuth"});
      stub(App, 'iframeGet');

      TH.selectMenu('nav [name=export]', 'sql');

      assert.calledWith(App.iframeGet, {
        id: 'iframeExportOrg',
        src: '/export/sql/piki-pg.sql?org001&mySessAuth',
        errorMsg: 'Export Data failed'});


      App.iframeGet.reset();

      TH.selectMenu('nav [name=export]', 'csv');

      assert.calledWith(App.iframeGet, {
        id: 'iframeExportOrg',
        src: '/export/csv/piki-csv.zip?org001&mySessAuth',
        errorMsg: 'Export Data failed'});
    });

    test("onEntry onExit", ()=>{
      Route.gotoPage(SystemSetup);

      assert.dom('#SystemSetup', function () {
        assert.dom('.menu', function () {
          assert.dom('button.link', {count: 3});
        });
      });


      Dom.tpl.SystemSetup.onBaseExit();

      refute.dom('#SystemSetup');
    });

    test("renders orgs list", ()=>{
      var orgs = Factory.createList(2, 'createOrg');

      Route.gotoPage(Dom.tpl.SystemSetup);

      assert.dom('table.orgs', function () {
        assert.dom('td', orgs[0].name);
      });
    });

    test("renders users list", ()=>{
      v.org = Factory.createOrg({name: 'org1'});

      setOrg();

      var users = Factory.createList(2, 'createUser');

      assert.dom('h1', 'org1 Users');
      assert.dom('table.users', function () {
        assert.dom('td', users[0].name);
      });
    });

    test("addOrg", ()=>{
      Route.gotoPage(Dom.tpl.SystemSetup);

      assert.dom('#SystemSetup', function () {
        TH.click('[name=addOrg]');
      });
      assert.dom('#OrgForm', function () {
        assert.dom('label', 'Name', function () {
          TH.input('[name=name]', 'Foo Bar');
        });
        TH.input('[name=shortName]', 'FB');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });

      refute.dom('#OrgForm');
      assert.dom('#SystemSetup');

      var org = Org.query.where('shortName', 'FB').fetchOne();

      assert(org);

      assert.attributesEqual(org, {name: 'Foo Bar', shortName: 'FB', email: 'fb@foo.com'}, ['_id']);
    });
    group("edit org", ()=>{
      beforeEach(()=>{
        v.org = Factory.createOrg();
        v.org2 = Factory.createOrg();

        Route.gotoPage(Dom.tpl.SystemSetup.Index);

        TH.click('td', v.org.name);
      });

      test("change name", ()=>{
        assert.dom('#OrgForm', function () {
          TH.input('[name=name]', {value: v.org.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#SystemSetup', function () {
          assert.dom('td', 'new name');
        });
      });

      test("delete", ()=>{
        assert.dom('#OrgForm', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.org.name + '?');
          TH.click('[name=cancel]');
        });

        refute.dom('.Dialog');

        assert(Org.exists(v.org._id));

        TH.click('#OrgForm [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#OrgForm');

        refute(Org.exists(v.org._id));
      });
    });

    test("addUser", ()=>{
      v.org = Factory.createOrg();
      setOrg();

      assert.dom('#SystemSetup', function () {
        TH.click('[name=addUser]');
      });
      assert.dom('#UserForm', function () {
        assert.dom('label', 'Name', function () {
          TH.input('[name=name]', 'Foo Bar');
        });
        TH.input('[name=initials]', 'FB');
        TH.change('[name=role]', 'a');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });


      var user = User.query.where('name', 'Foo Bar').fetchOne();
      assert(user);
      assert.attributesEqual(user, {
        org_id: v.org._id, name: 'Foo Bar', initials: 'FB', email: 'fb@foo.com',
        role: 'a',
      }, ['_id']);

      refute.dom('#UserForm');
      assert.dom('#SystemSetup');
    });

    group("edit user", ()=>{
      beforeEach(()=>{
        v.org = Factory.createOrg();
        v.user = Factory.createUser();
        v.user2 = Factory.createUser();

        setOrg();

        TH.click('td', v.user.name);
      });

      test("change name", ()=>{
        assert.dom('#UserForm', function () {
          TH.input('[name=name]', {value: v.user.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#SystemSetup', function () {
          assert.dom('td', 'new name');
        });
      });

      test("delete", ()=>{
        assert.dom('#UserForm', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.user.name + '?');
          TH.click('[name=cancel]');
        });

        refute.dom('.Dialog');

        assert(User.exists(v.user._id));

        TH.click('#UserForm [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#UserForm');

        assert.same(v.user.$reload().attributes.role, undefined);
      });
    });
  });

  function setOrg() {
    App.orgId = v.org._id;
    Dom.addClass(document.body, 'inOrg');
    App._setOrgShortName(v.org.shortName);

    Route.replacePage(SystemSetup, {orgSN: v.org.shortName});
  }
});
