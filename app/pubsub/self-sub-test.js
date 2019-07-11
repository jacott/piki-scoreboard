isClient && define((require, exports, module)=>{
  const AllSub          = require('koru/pubsub/all-sub');
  const Org             = require('models/org');
  const TH              = require('test-helper');

  const {stub, spy, onEnd} = TH;

  const SelfSub = require('./self-sub');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    test("wiring", ()=>{
      assert.same(SelfSub.pubName, 'Self');
      assert(SelfSub.prototype instanceof AllSub);

      assert.equals(Array.from(SelfSub.includedModels()), [Org]);
    });
  });
});
