define(function (require, exports, module) {
  const koru    = require('koru');
  const Model   = require('koru/model');
  const Val     = require('koru/model/validation');
  const publish = require('koru/session/publish');
  const TH      = require('./test-helper');

  const sut     = require('./publish-event');
  var test, v;

  const children = ['Competitor', 'Result'];


  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser('su');
      v.otherUser = TH.Factory.createUser();

      v.cm = {};
      children.forEach(function (modelName) {
        v.cm[modelName] = TH.Factory['create' + modelName]();
      });

      TH.loginAs(v.user);

      test.stub(Val, 'ensureString');
    },

    tearDown() {
      TH.cleanUpTest(v);
      v = null;
    },

    "test observes org"() {
      var obSpys = children.map(function (modelName) {
        return test.spy(Model[modelName], 'observeEvent_id');
      });

      var sub = TH.mockSubscribe(v, 's123', 'Event', v.event._id);

      assert.calledWith(Val.ensureString, v.event._id);

      children.forEach(function (modelName) {
        assert.calledWith(v.conn.added, modelName, v.cm[modelName]._id, v.cm[modelName].attributes);
      });

      // *** test stopping ***
      var stopSpys = obSpys.map(function (spy) {
        assert.calledWith(spy, v.event._id);
        return test.spy(spy.firstCall.returnValue, 'stop');
      });

      sub.stop();

      stopSpys.forEach(function (spy) {
        assert.called(spy);
      });
    },
  });
});
