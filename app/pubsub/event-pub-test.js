isServer && define((require, exports, module)=>{
  const TH              = require('koru/model/test-db-helper');
  const ConnTH          = require('koru/session/conn-th-server');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, util} = TH;

  const EventPub = require('pubsub/event-pub');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let conn;
    beforeEach(()=>{
      TH.startTransaction();
      conn = ConnTH.mockConnection();
    });

    afterEach(()=>{
      ConnTH.stopAllSubs(conn);
      EventPub.shutdown();
      TH.rollbackTransaction();
    });

    test("publish event", ()=>{
      const event = Factory.createEvent();
      const climber = Factory.createClimber();
      const competitor = Factory.createCompetitor();
      const result = Factory.createResult();

      const sub = conn.onSubscribe('sub1', 1, "Event", event._id);

      assert.calledOnce(conn.sendEncoded);
      assert.encodedCall(conn, 'A', ['Competitor', competitor.attributes]);
      assert.encodedCall(conn, 'A', ['Result', result.attributes]);
      conn.sendEncoded.reset();

      result.$update({scores: [1, 220000, 440000]});
      assert.encodedCall(conn, 'C', ['Result', result._id, {scores: [1, 220000, 440000]}]);
    });
  });
});
