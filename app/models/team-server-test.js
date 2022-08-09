define((require, exports, module) => {
  const koru            = require('koru');
  const Org             = require('./org');
  const User            = require('./user');
  const Competitor      = require('models/competitor');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  const Team = require('./team');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, user;
    beforeEach(async () => {
      await TH.startTransaction();
      org = await Factory.createOrg();
      user = await Factory.createUser();
      stub(koru, 'info');
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    group('authorize', () => {
      test('denied', async () => {
        const oOrg = await Factory.createOrg();
        const oUser = await Factory.createUser();

        const team = await Factory.buildTeam();

        await assert.accessDenied(() => team.authorize(user._id));
      });

      test('allowed', async () => {
        const team = await Factory.buildTeam();

        await refute.accessDenied(() => team.authorize(user._id));
      });

      test('okay to remove', async () => {
        const team = await Factory.createTeam();

        await refute.accessDenied(() => team.authorize(user._id, {remove: true}));
      });

      test('remove in use', async () => {
        const team = await Factory.createTeam();
        const competitor = await Factory.createCompetitor();

        await assert.accessDenied(() => team.authorize(user._id, {remove: true}));
      });
    });
  });
});
