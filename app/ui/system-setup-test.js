isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var SystemSetup = require('./system-setup');
  var Route = require('koru/ui/route');
  var Dom = require('koru/dom');
  var UserAccount = require('koru/user-account');
  var Org = require('models/org');
  var User = require('models/user');
  var App = require('./app-base');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.su = TH.Factory.createUser('su');
      TH.loginAs(v.su);
      App.setAccess();
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test onEntry onExit": function () {
      Route.gotoPage(SystemSetup);

      assert.dom('#SystemSetup', function () {
        assert.dom('.menu', function () {
          assert.dom('button.link', {count: 2});
        });
      });


      Dom.SystemSetup.onBaseExit();

      refute.dom('#SystemSetup');
    },

    "test renders orgs list": function () {
      var orgs = TH.Factory.createList(2, 'createOrg');

      Route.gotoPage(Dom.SystemSetup);

      assert.dom('table.orgs', function () {
        assert.dom('td', orgs[0].name);
      });
    },

    "test renders users list": function () {
      v.org = TH.Factory.createOrg({name: 'org1'});

      setOrg();

      var users = TH.Factory.createList(2, 'createUser');

      assert.dom('h1', 'org1 Users');
      assert.dom('table.users', function () {
        assert.dom('td', users[0].name);
      });
    },

    "test addOrg": function () {
      Route.gotoPage(Dom.SystemSetup);

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
    },
    "edit org": {
      setUp: function () {
        v.org = TH.Factory.createOrg();
        v.org2 = TH.Factory.createOrg();

        Route.gotoPage(Dom.SystemSetup.Index);

        TH.click('td', v.org.name);
      },

      "test change name": function () {
        assert.dom('#OrgForm', function () {
          TH.input('[name=name]', {value: v.org.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#SystemSetup', function () {
          assert.dom('td', 'new name');
        });
      },

      "test delete": function () {
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
      },
    },

    "test addUser": function () {
      v.org = TH.Factory.createOrg();
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
        TH.change('[name=org_id]', v.org._id);
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
    },

    "edit user": {
      setUp: function () {
        v.org = TH.Factory.createOrg();
        v.user = TH.Factory.createUser();
        v.user2 = TH.Factory.createUser();

        setOrg();

        TH.click('td', v.user.name);
      },

      "test change name": function () {
        assert.dom('#UserForm', function () {
          TH.input('[name=name]', {value: v.user.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#SystemSetup', function () {
          assert.dom('td', 'new name');
        });
      },

      "test delete": function () {
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

        refute(User.exists(v.user._id));
      },
    },
  });

  function setOrg() {
    App.orgId = v.org._id;
    Dom.addClass(document.body, 'inOrg');
    App._setOrgShortName(v.org.shortName);

    Route.replacePage(SystemSetup, {orgSN: v.org.shortName});
  }
});
