define((require, exports, module)=>{
  const publish         = require('koru/session/publish');
  const Factory         = require('test/factory');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

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
      const {sub} = v;
      const event = Factory.createEvent();
      const comp = Factory.createCompetitor();
      const matchUser = sub.match.withArgs('Competitor', TH.match.func);

      sut.init.call(sub, event._id);

      assert.calledOnce(matchUser);

      const m = matchUser.args(0, 1);

      assert.isTrue(m({event_id: event._id}));
      assert.isFalse(m({event_id: 'x'+event._id}));

      'Competitor Result'.split(' ').forEach(name =>{
        assert.calledWith(sub.match, name, m);
      });

      const unmatch = stub();
      sub._onStop(sub, unmatch);

      assert.calledWith(unmatch, comp);

    });
  });
});
