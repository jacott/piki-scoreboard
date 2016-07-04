define(function (require, _, module) {
  var test, v;
  const TH       = require('test-helper');
  const sut      = require('./event');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test sortedTeamTypes"() {
      let tt1 = TH.Factory.createTeamType();
      let tt2 = TH.Factory.createTeamType();
      let event = TH.Factory.createEvent({teamType_ids: [tt2._id, tt1._id]});

      let stt = event.sortedTeamTypes;
      assert.same(event.sortedTeamTypes, stt);
      assert.equals(event.sortedTeamTypes, [tt1, tt2]);

      event.$update('teamType_ids', [tt1._id]);
      assert.equals(event.$reload().sortedTeamTypes, [tt1]);
    },
  });
});
