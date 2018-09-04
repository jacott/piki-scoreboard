define((require, exports, module)=>{
  const koru            = require('koru');
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const publish         = require('koru/session/publish');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  const sut = require('./publish-event-server');

  const children = ['Competitor', 'Result'];

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      test = this;
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser('su');
      v.otherUser = TH.Factory.createUser();

      v.cm = {};
      children.forEach(modelName =>{
        v.cm[modelName] = TH.Factory['create' + modelName]();
      });

      TH.loginAs(v.user);

      stub(Val, 'ensureString');
    });

    afterEach(()=>{
      TH.cleanUpTest(v);
      v = null;
    });

    test("observes org", ()=>{
      var obSpys = children.map(modelName => spy(Model[modelName], 'observeEvent_id'));

      var sub = TH.mockSubscribe(v, 's123', 'Event', v.event._id);

      assert.calledWith(Val.ensureString, v.event._id);

      children.forEach(modelName =>{
        assert.calledWith(v.conn.added, modelName, v.cm[modelName]._id, v.cm[modelName].attributes);
      });

      // *** test stopping ***
      var stopSpys = obSpys.map(cb =>{
        assert.calledWith(cb, [v.event._id]);
        return spy(cb.firstCall.returnValue, 'stop');
      });

      sub.stop();

      stopSpys.forEach(cb => {
        assert.called(cb);
      });
    });
  });
});
