isServer && define((require, exports, module)=>{
  const TH              = require('test-helper');

  const emailText = require('./email-text');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("sendResetPasswordEmailText", ()=>{
      const user = TH.Factory.createUser({name: 'Kate Sheppard'});
      const result = emailText.sendResetPasswordEmailText(user, 'foo-bar');

      assert.match(result, /Hello Kate Sheppard/);

      assert.match(result, /http:\/\/test.piki\/#reset-password\/foo-bar/);
    });

  });
});
