isClient && define(function (require, exports, module) {
  const Dom             = require('koru/dom');
  const session         = require('koru/session');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const ClientLogin     = require('koru/user-account/client-login');
  const User            = require('models/user');
  const Event           = require('ui/event');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  const Profile = require('./profile');
  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {};
      v.su = TH.Factory.createUser('su');
      TH.setOrg();
      TH.loginAs(v.user = TH.Factory.createUser());
      Route.gotoPage(Profile);
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test rendering"() {
      assert.dom('#Profile', function () {
        assert.dom('h1', v.user.name);
        assert.dom('.fields', fields => {
          assert.dom('[name=name]', {value: v.user.name});
          assert.dom('[name=initials]', {value: v.user.initials});
          assert.dom('[name=email]', {value: v.user.email});
        });
      });
    },

    "test change email"() {
      assert.dom('form', function () {
        TH.input('[name=name]', {value: v.user.name}, 'new name');
        TH.click('[type=submit]');
      });

      assert.equals(User.me().name, 'new name');

    },

    "test change password"() {
      var cpwStub = stub(UserAccount,'changePassword');

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

        assert.calledWith(cpwStub,v.user.email, 'oldpw', 'newpw', TH.match(function (func) {
          v.func = func;
          return typeof func === 'function';
        }));

        stub(Route.history, 'back');

        v.func('fail');

        assert.dom('.errorMsg', 'invalid password.');

        refute.called(Route.history.back);

        v.func();
      });
      assert.called(Route.history.back);
    },
  });
});
