(function (test, v) {
  buster.testCase('client/system-setup:', {
    setUp: function () {
      test = this;
      v = {};
      App.Ready.isReady = true;
    },

    tearDown: function () {
      AppRoute.gotoPage();
      v = null;
    },

    "test onEntry onExit": function () {
      AppRoute.gotoPage(Bart.SystemSetup);

      assert.dom('#SystemSetup', function () {
        assert.dom('.menu', function () {
          assert.dom('button.link', {count: 2});
        });
      });


      Bart.SystemSetup.onBaseExit();

      refute.dom('#SystemSetup');
    },

    "test renders orgs list": function () {
      var orgs = TH.Factory.createList(2, 'createOrg');

      AppRoute.gotoPage(Bart.SystemSetup);

      assert.dom('table.orgs', function () {
        assert.dom('td', orgs[0].name);
      });
    },

    "test renders users list": function () {
      v.org = TH.Factory.createOrg({name: 'org1'});

      var users = TH.Factory.createList(2, 'createUser');

      var orgSub = test.stub(App, 'subscribe').withArgs('Org');
      AppRoute.gotoPage(Bart.SystemSetup, {orgSN: v.org.shortName});
      orgSub.yield();

      assert.dom('h1', 'org1 Users');
      assert.dom('table.users', function () {
        assert.dom('td', users[0].name);
      });
    },

    "test addOrg": function () {
      AppRoute.gotoPage(Bart.SystemSetup);

      assert.dom('#SystemSetup', function () {
        TH.click('[name=addOrg]');
      });
      assert.dom('#AddOrg', function () {
        assert.dom('label', 'Name', function () {
          TH.input('[name=name]', 'Foo Bar');
        });
        TH.input('[name=shortName]', 'FB');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });

      refute.dom('#AddOrg');
      assert.dom('#SystemSetup');

      var org = AppModel.Org.findOne();

      assert(org);

      assert.attributesEqual(org, {name: 'Foo Bar', shortName: 'FB', email: 'fb@foo.com'}, ['_id']);
    },

    "test addUser": function () {
      v.org = TH.Factory.createOrg();
      App.Ready.isReady = true;
      v.orgSub = test.stub(App, 'subscribe').withArgs('Org');
      AppRoute.gotoPage(Bart.SystemSetup, {orgSN: v.org.shortName});
      v.orgSub.yield();

      assert.dom('#SystemSetup', function () {
        TH.click('[name=addUser]');
      });
      assert.dom('#AddUser', function () {
        assert.dom('label', 'Name', function () {
          TH.input('[name=name]', 'Foo Bar');
        });
        TH.input('[name=initials]', 'FB');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });

      refute.dom('#AddUser');
      assert.dom('#SystemSetup');

      var user = AppModel.User.findOne({name: 'Foo Bar'});

      assert(user);

      assert.attributesEqual(user, {org_id: v.org._id, name: 'Foo Bar', initials: 'FB', email: 'fb@foo.com'}, ['_id']);
    },
  });
})();
