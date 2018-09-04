define((require, exports, module)=>{
  const publish         = require('koru/session/publish');
  const TH              = require('./test-helper');

  require('./publish-event-client');

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
      const sut = publish._pubs.Event;
      const event = TH.Factory.createEvent();
      const matchUser = v.sub.match.withArgs('Competitor', TH.match.func);

      sut.call(v.sub, event._id);

      assert.calledOnce(matchUser);

      const m = matchUser.args(0, 1);

      assert.isTrue(m({event_id: event._id}));
      assert.isFalse(m({event_id: 'x'+event._id}));

      'Result'.split(' ').forEach(name =>{
        assert.calledWith(v.sub.match, name, m);
      });
    });
  });
});
