define((require, exports, module)=>{
  const publish         = require('koru/session/publish');
  const TH              = require('./test-helper');

  require('./publish-self-client');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v.sub = TH.mockClientSub();
    });

    afterEach(()=>{
      TH.cleanUpTest(v);
      v = {};
    });

    test("publish", ()=>{
      const sut = publish._pubs.Self;
      const matchUser = v.sub.match.withArgs('User', TH.match.func);
      const matchOrg = v.sub.match.withArgs('Org', TH.match.func);

      sut.call(v.sub, 'o1');

      assert.calledOnce(matchUser);
      assert.calledOnce(matchOrg);

      const mu = matchUser.args(0, 1);
      const mo = matchOrg.args(0, 1);

      v.sub.userId = 'ufoo';

      assert.isTrue(mu({_id: 'ufoo'}));
      assert.isFalse(mu({_id: 'xfoo'}));

      assert.isTrue(mo());
    });
  });
});
