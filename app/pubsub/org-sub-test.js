isClient && define((require, exports, module)=>{
  const ModelMap        = require('koru/model/map');
  const TH              = require('koru/model/test-db-helper');
  const Subscription    = require('koru/pubsub/subscription');
  const SubscriptionSession = require('koru/pubsub/subscription-session');
  const Session         = require('koru/session');

  const {stub, spy, onEnd, util} = TH;

  const OrgSub = require('./org-sub');

  const models = ['Category', 'Climber', 'Event', 'Series', 'Team', 'TeamType', 'User'];

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
      const matcher = sub.match.lastCall.args[1];
      assert.isTrue(sub.match.calls[1].args[1]({org_id: 'org123'}));
      assert.isFalse(sub.match.calls[1].args[1]({org_id: 'org456'}));
      for (const call of sub.match.calls.slice(2)) assert.same(call.args[1], matcher);
      assert.isTrue(matcher({org_id: 'org123'}));
      assert.isFalse(matcher({org_id: 'org456'}));
    });
  });
});
