define((require, exports, module) => {
  const koru            = require('koru');
  const Event           = require('./event');
  const Org             = require('./org');
  const User            = require('./user');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, user;
    beforeEach(async () => {
      await TH.startTransaction();
      org = await Factory.createOrg();
      user = await Factory.createUser();
      TH.noInfo();
    });

    afterEach(() => TH.rollbackTransaction());

    group('authorize', () => {
      test('wrong org denied', async () => {
        const oOrg = await Factory.createOrg();
        const oUser = await Factory.createUser();

        const event = await Factory.buildEvent();

        await assert.accessDenied(() => event.authorize(user._id));
      });

      test('allowed', async () => {
        const event = await Factory.buildEvent();

        refute.accessDenied(() => {
          event.authorize(user._id);
        });
      });

      test('series_id', async () => {
        const ev = await Factory.createEvent();
        ev.changes.series_id = 'bad';

        await assert.accessDenied(() => ev.authorize(user._id));

        ev.changes.series_id = '';

        await assert.exception(() => ev.authorize(user._id), {error: 400, reason: {series_id: [['is_invalid']]}});

        ev.changes.series_id = (await Factory.createSeries())._id;
        await ev.authorize(user._id);

        const org = await Factory.createOrg();
        ev.changes.series_id = (await Factory.createSeries())._id;
        await assert.accessDenied(() => ev.authorize(user._id));
      });

      test('permitParams', async () => {
        const event = await Factory.buildEvent();

        event.attributes = event.changes;
        event.changes = {name: 'new name'};
        await assert.docChanges(event, {
          name: 'string',
          ruleVersion: 'number',
          teamType_ids: ['id'],
          date: 'string',
          closed: TH.match((arg) => {
            return arg.test(undefined) &&
              arg.test(false) && ! arg.test([]) &&
              arg.test('f') && ! arg.test(1);
          }),
          heats: 'baseObject',
          series_id: 'id',
        }, {
          _id: 'id',
          org_id: 'id',
        }, () => event.authorize(user._id));
      });

      test('closing', async () => {
        const event = await Factory.buildEvent();
        event.attributes = event.changes;
        event.changes = {closed: true, name: 'new Name'};

        await refute.accessDenied(() => event.authorize(user._id));
      });

      test('change on closed', async () => {
        const event = await Factory.buildEvent({closed: true});
        event.attributes = event.changes;
        event.changes = {name: 'bob'};

        await assert.accessDenied(() => event.authorize(user._id));
      });

      test('opening', async () => {
        const event = await Factory.buildEvent({closed: false});
        event.attributes = event.changes;
        event.changes = {closed: 'true'};

        await refute.accessDenied(() => event.authorize(user._id));
      });
    });
  });
});
