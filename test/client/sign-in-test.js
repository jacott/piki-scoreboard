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
      assert.dom('[name=profile]');
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
