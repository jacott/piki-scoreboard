define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./publish-event');
  var publish = require('koru/session/publish');
  var Model = require('koru/model');
  var koru = require('koru');
  var Val = require('koru/model/validation');

  var children = ['Competitor', 'Result'];

  TH.testCase(module, {
    setUp: function () {
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

    tearDown: function () {
      TH.cleanUpTest(v);
      v = null;
    },

    "test observes org": function () {
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
        return test.spy(spy.returnValues[0], 'stop');
      });

      sub.stop();

      stopSpys.forEach(function (spy) {
        assert.called(spy);
      });
    },
  });
});
