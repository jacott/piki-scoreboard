(function (test, v) {
  buster.testCase('client/profile:', {
    setUp: function () {
      test = this;
      v = {};
      v.su = TH.Factory.createUser('su');
      TH.setOrg();
    },

    tearDown: function () {
      v = null;
    },

    "with user": {
      setUp: function () {
        TH.login(v.user = TH.Factory.createUser());

        AppRoute.gotoPage(Bart.Profile);
      },


      "test rendering": function () {
        assert.dom('#Profile', function () {
          assert.dom('h1', v.user.name);
        });
      },

      "test change password": function () {
        var cpwStub = test.stub(Accounts,'changePassword');

        TH.click('.link', "Change password");
        assert.dom('#Profile .body #ChangePassword', function () {
          TH.input('input[name=oldPassword]', 'oldpw');
          assert.dom('button[type=submit][disabled=disabled]');
          TH.input('input[name=newPassword]', 'newpw');
          TH.input('input[name=confirm]', 'newp');
          assert.dom('button[type=submit][disabled=disabled]');
          TH.input('input[name=confirm]', 'newpw');
          refute.dom('button[type=submit][disabled=disabled]');
          TH.click('button[type=submit]');

          assert.className(this, 'submitting');

          assert.calledWith(cpwStub,'oldpw', 'newpw', sinon.match(function (func) {
            v.func = func;
            return typeof func === 'function';
          }));

          test.stub(AppRoute.history, 'back');

          v.func('fail');

          assert.dom('.errorMsg', 'invalid password.');

          refute.called(AppRoute.history.back);

          v.func();
        });
        assert.called(AppRoute.history.back);
      },
    },

    "test super user has system-setup link": function () {
      TH.login(v.su);

      AppRoute.gotoPage(Bart.Profile);

      assert.dom('#Profile>div>nav', function () {
        TH.click('button.link', "System setup");
      });

      assert.dom('#SystemSetup');
    },
  });
})();
