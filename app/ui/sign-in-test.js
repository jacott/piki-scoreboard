isClient && define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const localStorage    = require('koru/local-storage');
  const session         = require('koru/session');
  require('koru/ui/page-link');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const login           = require('koru/user-account/client-login');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const App             = require('ui/app');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd, match: m} = TH;

  const SignIn = require('./sign-in');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      stub(UserAccount,'loginWithPassword');
      App.orgId = Factory.createOrg()._id;
    });

    afterEach(()=>{
      TH.tearDown();
      v = {};
    });

    test("clicking forgot password", ()=>{
      Route.gotoPage(SignIn);
      TH.input('[name=email]', 'email@address');
      TH.click('[name=forgot]');

      refute.dom('#SignInDialog');

      assert.dom('.Dialog #ForgotPassword', () =>{
        assert.dom('[name=email]', {value: 'email@address'});
      });
    });

    group("forgot password", ()=>{
      beforeEach( ()=>{
        v.remoteCall = stub(User, 'forgotPassword');

        Dom.tpl.Dialog.open(SignIn.ForgotPassword.$autoRender({email: 'foo@bar.com'}));

        TH.click('#ForgotPassword [name=submit]');

        assert.calledWith(v.remoteCall, 'foo@bar.com', m(c => v.callback = c));
      });

      test("bad email", ()=>{
        v.callback(null, {email: 'is_invalid'});

        assert.dom('#ForgotPassword', elm =>{
          assert.dom('input.error[name=email]');
          assert.dom('input.error[name=email]+.errorMsg', 'is not valid');

          v.callback(null, {success: true});

          refute.dom('.error');
        });
      });

      test("unexpected error", ()=>{
        stub(koru, 'error');

        v.callback({message: 'foo'});

        assert.dom('#ForgotPassword', ()=>{
          assert.dom('[name=submit].error', elm =>{
            assert.same(elm.style.display, 'none');

          });
          assert.dom('[name=submit]+.errorMsg', 'An unexpected error occured. Please reload page.');
        });

        assert.calledOnceWith(koru.error, 'foo');
      });
    });

    test("signing in", ()=>{
      TH.loginAs(Factory.createUser('guest'));
      Route.gotoPage(SignIn);
      stub(Route.history, 'back');

      assert.dom('#SignIn', function () {
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

        assert.calledWith(UserAccount.loginWithPassword, 'test', 'bad',
                          m(func => v.loginCallback = func));

        assert.dom('form.submit-state #SignInProgress', 'Signing in...');
        v.loginCallback('ex');

        assert.dom('form.error-state #SignInProgress', 'Invalid email or password');

        assert.dom('[type=submit]', function () {
          assert.same(this.style.display, '');
        });

        v.loginCallback();
      });
      assert.called(Route.history.back);
    });

    test("cancel", ()=>{
      Route.gotoPage(SignIn);
      stub(Route.history, 'back');
      TH.click('[name=cancel]');

      assert.called(Route.history.back);
    });
  });
});
