isServer && define((require, exports, module) => {
  const TH              = require('koru/model/test-db-helper');
  const ConnTH          = require('koru/session/conn-th-server');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, util} = TH;

  const EventPub = require('pubsub/event-pub');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let conn;
    beforeEach(async () => {
      await TH.startTransaction();
      conn = ConnTH.mockConnection();
    });

    afterEach(async () => {
      ConnTH.stopAllSubs(conn);
      EventPub.shutdown();
      await TH.rollbackTransaction();
    });

    test('publish event', async () => {
      const event = await Factory.createEvent();
      const climber = await Factory.createClimber();
      const competitor = await Factory.createCompetitor();
      const result = await Factory.createResult();

      const sub = await conn.onSubscribe('sub1', 1, 'Event', event._id);

      assert.calledOnce(conn.sendEncoded);
      assert.encodedCall(conn, 'A', ['Competitor', competitor.attributes]);
      assert.encodedCall(conn, 'A', ['Result', result.attributes]);
      conn.sendEncoded.reset();

      await result.$update({scores: [1, 220000, 440000]});
      assert.encodedCall(conn, 'C', ['Result', result._id, {scores: [1, 220000, 440000]}]);
    });
  });
});
