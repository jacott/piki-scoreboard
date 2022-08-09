isClient && define((require, exports, module) => {
  'use strict';
  const koru            = require('koru');
  const Random          = require('koru/random');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const sut             = require('./reset-password');
  const TH              = require('./test-helper');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const App             = require('ui/app');

  const {stub, spy, after, match: m} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, user, key;
    beforeEach(() => {
      TH.startTransaction();
      org = Factory.createOrg();
      TH.loginAs(user = Factory.createUser());
      TH.setOrg(org);
      key = Random.id();
      stub(UserAccount, 'resetPassword');
      stub(Route, 'replacePath');
    });

    afterEach(() => {
      TH.domTearDown();
      TH.rollbackTransaction();
    });

    test('token expired', () => {
      Route.gotoPath('/reset-password/' + key);

      TH.input('[name=newPassword]', 'secret');
      TH.input('[name=confirm]', 'secret');
      TH.click('[type=submit]');

      let callback;
      assert.calledWith(UserAccount.resetPassword, key, 'secret', m((c) => callback = c));

      stub(koru, 'error');

      callback({error: 403, reason: 'token expired', message: 'foo'});

      assert.dom('#ResetPassword', () => {
        assert.dom('.error[name=newPassword]+.errorMsg', 'token expired');
      });

      assert.calledWith(koru.error, 'foo');
    });

    test('update', () => {
      Route.gotoPath('/reset-password/' + key);

      assert.dom('#ResetPassword', () => {
        assert.dom('form', () => {
          TH.click('[type=submit]');
          refute.called(UserAccount.resetPassword);
          TH.input('[name=newPassword]', 'secret');
          TH.input('[name=confirm]', 'secret');
        });
        TH.click('[type=submit]');
      });

      let callback;
      assert.calledWith(UserAccount.resetPassword, key, 'secret', m((c) => callback = c));

      callback(null);

      assert.calledWith(Route.replacePath, Route.root.defaultPage);
    });
  });
});
