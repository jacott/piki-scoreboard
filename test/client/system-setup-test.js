(function (test, v) {
  buster.testCase('client/system-setup:', {
    setUp: function () {
      test = this;
      v = {};
      v.subStub = test.stub(App, 'subscribe');
      v.allOrgsStub = v.subStub.withArgs('SU').returns({stop: v.stopAllOrgsStub = test.stub()});
    },

    tearDown: function () {
      AppRoute.gotoPage();
      v = null;
    },

    "test onEntry onExit": function () {
      AppRoute.gotoPage(Bart.SystemSetup);

      assert.called(v.allOrgsStub);

      assert.select('#SystemSetup', function () {
        assert.select('.menu', function () {
          assert.select('[name=addOrg]');
        });
      });


      Bart.SystemSetup.onBaseExit();

      refute.select('#SystemSetup');
      assert.called(v.stopAllOrgsStub);
    },

    "test addOrg": function () {
      AppRoute.gotoPage(Bart.SystemSetup);

      assert.select('#SystemSetup', function () {
        TH.click('[name=addOrg]');
      });
      assert.select('#AddOrg', function () {
        assert.selectParent('label', 'Name', function () {
          TH.input('[name=name]', 'Foo Bar');
        });
        TH.input('[name=shortName]', 'FB');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });

      refute.select('#AddOrg');
      assert.select('#SystemSetup');

      var org = AppModel.Org.findOne();

      assert(org);

      assert.attributesEqual(org, {name: 'Foo Bar', shortName: 'FB', email: 'fb@foo.com'}, ['_id']);
    },

    "test addUser": function () {
      v.org = TH.Factory.createOrg();
      Bart.Main.id = v.org._id;
      AppRoute.gotoPage(Bart.SystemSetup);

      assert.select('#SystemSetup', function () {
        TH.click('[name=addUser]');
      });
      assert.select('#AddUser', function () {
        assert.selectParent('label', 'Name', function () {
          TH.input('[name=name]', 'Foo Bar');
        });
        TH.input('[name=initials]', 'FB');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });

      refute.select('#AddUser');
      assert.select('#SystemSetup');

      var user = AppModel.User.findOne({name: 'Foo Bar'});

      assert(user);

      assert.attributesEqual(user, {org_id: v.org._id, name: 'Foo Bar', initials: 'FB', email: 'fb@foo.com'}, ['_id']);
    },
  });
})();
