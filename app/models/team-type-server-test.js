define((require, exports, module) => {
  const koru            = require('koru');
  const Org             = require('./org');
  const User            = require('./user');
  const Event           = require('models/event');
  const Series          = require('models/series');
  const Team            = require('models/team');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  const TeamType = require('./team-type');

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

        const teamType = await Factory.buildTeamType();

        await assert.accessDenied(() => teamType.authorize(user._id));
      });

      test('allowed', async () => {
        const teamType = await Factory.buildTeamType();

        await refute.accessDenied(() => teamType.authorize(user._id));
      });

      test('okay to remove', async () => {
        const teamType = await Factory.createTeamType();

        await refute.accessDenied(() => teamType.authorize(user._id, {remove: true}));
      });

      test('remove in use with team', async () => {
        const teamType = await Factory.createTeamType();
        await Factory.createTeam();

        await assert.accessDenied(() => teamType.authorize(user._id, {remove: true}));
      });

      test('remove in use with series', async () => {
        const teamType = await Factory.createTeamType();
        await Factory.createSeries({teamType_ids: [teamType._id]});

        await assert.accessDenied(() => teamType.authorize(user._id, {remove: true}));
      });

      test('remove in use with event', async () => {
        const teamType = await Factory.createTeamType();
        await Factory.createEvent({teamType_ids: [teamType._id]});

        await assert.accessDenied(() => teamType.authorize(user._id, {remove: true}));
      });
    });
  });
});
