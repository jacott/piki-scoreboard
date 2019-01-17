isClient && define((require, exports, module)=>{
  const ModelMap        = require('koru/model/map');
  const TH              = require('koru/model/test-db-helper');
  const Subscription    = require('koru/pubsub/subscription');
  const SubscriptionSession = require('koru/pubsub/subscription-session');
  const Session         = require('koru/session');

  const {stub, spy, onEnd, util} = TH;

  const OrgSub = require('./org-sub');

  const models = ['Category', 'Climber', 'Event', 'Series', 'Team', 'TeamType'];

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      TH.startTransaction();
    });

    afterEach(()=>{
      SubscriptionSession.unload(Session);
      TH.rollbackTransaction();
    });

    test("connect", ()=>{
      const match = stub(Subscription.prototype, 'match');
      const sub = new OrgSub('org123');

      sub.connect();

      assert.equals(sub.match.calls.map(c => c.args[0]).sort(), models);
      const matcher = sub.match.firstCall.args[1];
      for (const call of sub.match.calls) assert.same(call.args[1], matcher);
      assert.isTrue(matcher({org_id: 'org123'}));
      assert.isFalse(matcher({org_id: 'org456'}));
    });
  });
});
