isServer && define((require, exports, module) => {
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const emailText = require('./email-text');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('sendResetPasswordEmailText', async () => {
      const user = await Factory.createUser({name: 'Kate Sheppard'});
      const result = await emailText.sendResetPasswordEmailText(user, 'foo-bar');

      assert.match(result, /Hello Kate Sheppard/);

      assert.match(result, /http:\/\/test.piki\/#reset-password\/foo-bar/);
    });
  });
});
