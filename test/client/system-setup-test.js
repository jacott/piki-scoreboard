(function (test, v) {
  buster.testCase('client/system-setup:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppRoute.gotoPage();
      v = null;
    },

    "test onEntry onExit": function () {
      AppRoute.gotoPage(Bart.SystemSetup);

      assert.dom('#SystemSetup', function () {
        assert.dom('.menu', function () {
          assert.dom('[name=addOrg]');
        });
      });


      Bart.SystemSetup.onBaseExit();

      refute.dom('#SystemSetup');
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
