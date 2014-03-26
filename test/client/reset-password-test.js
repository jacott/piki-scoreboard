(function (test, v) {
  buster.testCase('client/reset-password:', {
    setUp: function () {
      test = this;
      v = {
        key: Random.id(),
      };
      test.stub(Accounts, 'resetPassword');
      test.stub(AppRoute, 'replacePath');
    },

    tearDown: function () {
      v = null;
    },

    "test token expired": function () {
      AppRoute.gotoPath('/reset-password/' + v.key);

      TH.input('[name=newPassword]', 'secret');
      TH.input('[name=confirm]', 'secret');
      TH.click('[type=submit]');

      assert.calledWith(Accounts.resetPassword, v.key, 'secret', sinon.match(function (callback) {
        v.callback = callback;
        return typeof callback === 'function';
      }));

      test.stub(App, 'log');

      v.callback({error: 403, reason: 'token expired', message: 'foo'});

      assert.dom('#ResetPassword', function () {
        assert.dom('.error[name=newPassword]+span.errorMsg', 'token expired');
      });

      assert.calledWith(App.log, 'ERROR ', 'foo');
    },

    "test update": function () {
      AppRoute.gotoPath('/reset-password/' + v.key);

      assert.dom('#ResetPassword', function () {
        assert.dom('form', function () {
          TH.click('[type=submit]');
          refute.called(Accounts.resetPassword);
          TH.input('[name=newPassword]', 'secret');
          TH.input('[name=confirm]', 'secret');
        });
        TH.click('[type=submit]');
      });

      assert.calledWith(Accounts.resetPassword, v.key, 'secret', sinon.match(function (callback) {
        v.callback = callback;
        return typeof callback === 'function';
      }));

      v.callback(null);

      assert.calledWith(AppRoute.replacePath, Bart.Home);
    },
  });
})();
