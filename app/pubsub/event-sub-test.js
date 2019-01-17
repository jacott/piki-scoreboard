isClient && define((require, exports, module)=>{
  const ModelMap        = require('koru/model/map');
  const TH              = require('koru/model/test-db-helper');
  const Subscription    = require('koru/pubsub/subscription');
  const SubscriptionSession = require('koru/pubsub/subscription-session');
  const Session         = require('koru/session');

  const {stub, spy, onEnd, util, match: m, intercept} = TH;

  const EventSub = require('./event-sub');

  const models = ['Competitor', 'Result'];

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
      const sub = new EventSub('ev123');

      sub.connect();

      assert.equals(match.calls.map(c => c.args[0]).sort(), models);
      const matcher = sub.match.firstCall.args[1];
      for (const call of sub.match.calls) assert.same(call.args[1], matcher);
      assert.isTrue(matcher({event_id: 'ev123'}));
      assert.isFalse(matcher({event_id: 'org456'}));
    });

    test("stopped", ()=>{
      let unmatch;
      const sub = new EventSub();
      sub.args = 'ev123';
      const forEaches = {};
      for (const name of models) {
        const model = ModelMap[name];
        stub(model, 'where', (opts)=>{
          assert.equals(opts, {event_id: 'ev123'});
          return forEaches[name] = {forEach: stub(func =>{
            assert.same(func, unmatch);
          })};
        });
      }

      const stopped = sub.stopped;
      intercept(sub, 'stopped', arg => {
        unmatch = arg;
        return stopped.call(sub, arg);
      });

      sub.stop();

      for (const name of models) {
        const model = ModelMap[name];
        assert.calledOnce(model.where);
        assert.calledOnce(forEaches[name].forEach);
      }
    });

    test("reconnecting", ()=>{
      const sub = new EventSub();
      sub.args = 'ev123';
      const forEaches = {};
      for (const name of models) {
        const model = ModelMap[name];
        stub(model, 'where', (opts)=>{
          assert.equals(opts, {event_id: 'ev123'});
          return forEaches[name] = {forEach: stub(func =>{
            assert.same(func, Subscription.markForRemove);
          })};
        });
      }

      sub.reconnecting();

      for (const name of models) {
        const model = ModelMap[name];
        assert.calledOnce(model.where);
        assert.calledOnce(forEaches[name].forEach);
      }
    });
  });
});
