isClient && define(function (require, exports, module) {
  var test, v;

  var Dom         = require('koru/dom');
  var env         = require('koru/env');
  var Route       = require('koru/ui/route');
  var SignIn      = require('./sign-in');
  var TH          = require('./test-helper');
  var UserAccount = require('koru/user-account/client-main');
  var User        = require('models/client-user');
                    require('koru/ui/page-link');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      test.stub(UserAccount,'loginWithPassword');
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test profile link": function () {
      document.body.appendChild(SignIn.$autoRender({}));
      TH.login();

      UserAccount.notify('ready');
      refute.dom('[name=signIn]');
      test.stub(Route, 'gotoPath');
      TH.click('#ProfileLink');

      assert.calledWith(Route.gotoPath, Dom.Profile);
    },

    "test cancel": function () {
      Dom.Dialog.open(SignIn.Dialog.$autoRender({}));
      TH.click('[name=cancel]');

      refute.dom('.Dialog');
    },

    "test clicking forgot password": function () {
      Dom.Dialog.open(SignIn.Dialog.$autoRender({}));
      TH.input('[name=email]', 'email@address');
      TH.click('[name=forgot]');

      refute.dom('#SignInDialog');

      assert.dom('.Dialog #ForgotPassword', function () {
        assert.dom('[name=email]', {value: 'email@address'});
      });
    },

    "forgot password": {
      setUp: function () {
        v.remoteCall = test.stub(User, 'forgotPassword');

        Dom.Dialog.open(SignIn.ForgotPassword.$autoRender({email: 'foo@bar.com'}));

        TH.click('#ForgotPassword [name=submit]');

        assert.calledWith(v.remoteCall, 'foo@bar.com', TH.match(function (callback) {
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
        test.stub(env, 'error');

        v.callback({message: 'foo'});

        assert.dom('#ForgotPassword', function () {
          assert.dom('[name=submit].error', function () {
            assert.same(this.style.display, 'none');

          });
          assert.dom('[name=submit]+.errorMsg', 'An unexpected error occured. Please reload page.');
        });

        assert.calledOnceWith(env.error, 'foo');
      },
    },

    "test signing in": function () {
      TH.loginAs(TH.Factory.createUser('guest'));
      document.body.appendChild(SignIn.$autoRender({}));
      assert.dom('#SignIn', function () {
        TH.click('[name=signIn]');
      });

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

        assert.calledWith(UserAccount.loginWithPassword, 'test', 'bad', TH.match(function(func) {return v.loginCallback = func}));

        assert.dom('form.submit-state #SignInProgress', 'Signing in...');
        v.loginCallback('ex');

        assert.dom('form.error-state #SignInProgress', 'Invalid email or password');

        assert.dom('[type=submit]', function () {
          assert.same(this.style.display, '');
        });

        v.loginCallback();
      });

      refute.dom('.Dialog');
    },
  });
});
