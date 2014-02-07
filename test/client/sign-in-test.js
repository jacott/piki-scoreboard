(function (test, v) {
  buster.testCase('client/sign-in:', {
    setUp: function () {
      test = this;
      v = {};
      test.stub(Meteor,'loginWithPassword');
    },

    tearDown: function () {
      v = null;
    },

    "test profile link": function () {
      document.body.appendChild(Bart.SignIn.$autoRender({}));
      TH.login();

      App.Ready.notifyReady();
      refute.dom('[name=signIn]');
      test.stub(AppRoute, 'gotoPath');
      TH.click('#ProfileLink');

      assert.calledWith(AppRoute.gotoPath, Bart.Profile);
    },

    "test cancel": function () {
      Bart.Dialog.open(Bart.SignIn.Dialog.$autoRender({}));
      TH.click('[name=cancel]');

      refute.dom('.Dialog');
    },

    "test clicking forgot password": function () {
      Bart.Dialog.open(Bart.SignIn.Dialog.$autoRender({}));
      TH.input('[name=email]', 'email@address');
      TH.click('[name=forgot]');

      refute.dom('#SignInDialog');

      assert.dom('.Dialog #ForgotPassword', function () {
        assert.dom('[name=email]', {value: 'email@address'});
      });
    },

    "forgot password": {
      setUp: function () {
        v.remoteCall = test.stub(AppModel.User, 'forgotPassword');

        Bart.Dialog.open(Bart.SignIn.ForgotPassword.$autoRender({email: 'foo@bar.com'}));

        TH.click('#ForgotPassword [name=submit]');

        assert.calledWith(v.remoteCall, 'foo@bar.com', sinon.match(function (callback) {
          v.callback = callback;
          return true;
        }));
      },

      "test bad email": function () {
        v.callback(null, {email: 'is_invalid'});

        assert.dom('#ForgotPassword', function () {
          assert.dom('input.error[name=email]');
          assert.dom('input.error[name=email]+.errorMsg', 'not valid');

          v.callback(null, {success: true});

          refute.dom('.error');
        });
      },

      "test unexpected error": function () {
        v.callback({message: 'foo'});

        assert.dom('#ForgotPassword', function () {
          assert.dom('[name=submit].error', function () {
            assert.same(this.style.display, 'none');

          });
          assert.dom('[name=submit]+.errorMsg', 'An unexpected error occured. Please reload page.');
        });

        assert.calledOnceWith(App.log, 'ERROR: ', 'foo');
      },
    },

    "test signing in": function () {
      document.body.appendChild(Bart.SignIn.$autoRender({}));
      TH.click('[name=signIn]');

      assert.dom('.Dialog #SignInDialog', function () {
        assert.dom('form>fieldset:first-child', function () {
          assert.dom('label:first-child', function () {
            assert.dom('span', 'Email');
            TH.input('input[name=email]', 'test');
          });
          assert.dom('label:nth-child(2)', function () {
            assert.dom('span', 'Password');
            TH.input('input[name=password]', 'bad');
          });
        });
        assert.dom('#SignInProgress', '');
        TH.click('form>fieldset:nth-child(2)>[type=submit]');

        assert.calledWith(Meteor.loginWithPassword, 'test', 'bad', sinon.match(function(func) {return v.loginCallback = func}));

        assert.dom('form.submit #SignInProgress', 'Signing in...');
        v.loginCallback('ex');

        assert.dom('form.error #SignInProgress', 'Invalid email or password');

        assert.dom('[type=submit]', function () {
          assert.same(this.style.display, '');
        });

        v.loginCallback();
      });

      refute.dom('.Dialog');
    },
  });
})();
