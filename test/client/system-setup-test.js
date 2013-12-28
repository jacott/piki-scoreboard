(function (test, v) {
  buster.testCase('client/system-setup:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test onEntry onExit": function () {
      Bart.SystemSetup.onEntry();

      assert.select('#SystemSetup', function () {
        assert.select('.menu', function () {
          assert.select('[name=addOrg]');
        });
      });

      Bart.SystemSetup.onExit();
      refute.select('#SystemSetup');
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
        TH.input('[name=initials]', 'FB');
        TH.input('[name=email]', 'FB@foo.com');
        TH.click('[type=submit]');
      });

      refute.select('#AddOrg');
      assert.select('#SystemSetup');
    },
  });
})();
