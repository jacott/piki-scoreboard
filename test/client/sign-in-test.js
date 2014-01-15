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
      refute.select('[name=signIn]');
      assert.select('[name=profile]');
    },

    "test signing in": function () {
      document.body.appendChild(Bart.SignIn.$autoRender({}));
      TH.click('[name=signIn]');

      assert.select('.Dialog #SignInDialog', function () {
        assert.select('form>fieldset:first-child', function () {
          assert.select('label:first-child', function () {
            assert.select('span', 'Email');
            TH.input('input[name=email]', 'test');
          });
          assert.select('label:nth-child(2)', function () {
            assert.select('span', 'Password');
            TH.input('input[name=password]', 'bad');
          });
        });
        assert.select('#SignInProgress', '');
        TH.click('form>fieldset:nth-child(2)>[type=submit]');

        assert.calledWith(Meteor.loginWithPassword, 'test', 'bad', sinon.match(function(func) {return v.loginCallback = func}));

        assert.select('form.submit #SignInProgress', 'Signing in...');
        v.loginCallback('ex');

        assert.select('form.error #SignInProgress', 'Invalid email or password');

        assert.select('[type=submit]', function () {
          assert.same(this.style.display, '');
        });

        v.loginCallback();
      });

      refute.select('.Dialog');
    },
  });
})();
