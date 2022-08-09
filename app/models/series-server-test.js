define((require, exports, module) => {
  const util            = require('koru/util');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Series = require('./series');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let rpc, org, user;
    beforeEach(async () => {
      await TH.startTransaction();
      rpc = TH.mockRpc();
      org = await Factory.createOrg();
      user = await Factory.createUser();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    group('authorize', () => {
      test('wrong org denied', async () => {
        const oOrg = await Factory.createOrg();
        const oUser = await Factory.createUser();

        const series = await Factory.buildSeries();

        TH.noInfo();
        await assert.accessDenied(() => series.authorize(user._id));
      });

      test('allowed', async () => {
        const series = await Factory.buildSeries();

        await refute.accessDenied(() => series.authorize(user._id));
      });

      test('permitParams', async () => {
        const series = await Factory.buildSeries();

        series.attributes = series.changes;
        series.changes = {name: 'new name'};
        await assert.docChanges(series, {
          name: 'string',
          org_id: 'id',
          teamType_ids: ['id'],
          date: 'string',
          closed: TH.match((arg) => {
            return arg.test(undefined) &&
              arg.test(false) && ! arg.test([]) &&
              arg.test('f') && ! arg.test(1);
          }),
        }, () => series.authorize(user._id));
      });

      test('closing', async () => {
        const series = await Factory.buildSeries();
        series.attributes = series.changes;
        series.changes = {closed: true};

        await refute.accessDenied(() => series.authorize(user._id));
      });

      test('change on closed', async () => {
        const series = await Factory.buildSeries({closed: true});
        series.attributes = series.changes;
        series.changes = {name: 'bob'};

        TH.noInfo();
        await assert.accessDenied(() => series.authorize(user._id));
      });

      test('opening', async () => {
        const series = await Factory.buildSeries({closed: false});
        series.attributes = series.changes;
        series.changes = {closed: 'true'};

        await refute.accessDenied(() => series.authorize(user._id));
      });
    });
  });
});
