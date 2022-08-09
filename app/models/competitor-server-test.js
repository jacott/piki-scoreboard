define((require, exports, module) => {
  const Val             = require('koru/model/validation');
  const Competitor      = require('./competitor');
  const User            = require('./user');
  const Role            = require('models/role');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let event, user;
    beforeEach(async () => {
      await TH.startTransaction();
      event = await Factory.createEvent();
      user = await Factory.createUser();
      TH.noInfo();

      stub(Val, 'ensureString');
    });

    afterEach(() => TH.rollbackTransaction());

    group('authorize', () => {
      test('denied', async () => {
        const oOrg = await Factory.createOrg();
        const oEvent = await Factory.createEvent();
        const oUser = await Factory.createUser();

        const competitor = await Factory.buildCompetitor();

        await assert.accessDenied(() => competitor.authorize(user._id));
      });

      test('allowed', async () => {
        spy(Val, 'assertDocChanges');

        const competitor = await Factory.buildCompetitor({number: 123});

        await refute.accessDenied(() => competitor.authorize(user._id));

        assert.calledWith(Val.ensureString, event._id);
        assert.calledWith(Val.assertDocChanges, TH.matchModel(competitor), {
          category_ids: ['id'],
          team_ids: ['id'],
          number: 'integer',
        }, {
          _id: 'id',
          event_id: 'id',
          climber_id: 'id',
        });
      });

      test('event closed', async () => {
        const event = await Factory.createEvent({closed: true});
        const competitor = await Factory.buildCompetitor();

        await assert.accessDenied(() => competitor.authorize(user._id));
      });
    });
  });
});
