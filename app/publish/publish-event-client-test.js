define(function (require, exports, module) {
  const publish = require('koru/session/publish');
  require('./publish-event');
  const TH      = require('./test-helper');
  var test, v;

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.sub = TH.mockClientSub();
    },

    tearDown: function () {
      TH.cleanUpTest(v);
      v = null;
    },

    "test publish": function () {
      var sut = publish._pubs.Event;
      var event = TH.Factory.createEvent();
      var matchUser = v.sub.match.withArgs('Competitor', TH.match.func);

      sut.call(v.sub, event._id);

      assert.calledOnce(matchUser);

      var m = matchUser.args(0, 1);

      assert.isTrue(m({event_id: event._id}));
      assert.isFalse(m({event_id: 'x'+event._id}));

      'Result'.split(' ').forEach(function (name) {
        assert.calledWith(v.sub.match, name, m);
      });
    },
  });
});
