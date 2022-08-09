define((require, exports, module) => {
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const sut = require('./event');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('sortedTeamTypes', () => {
      const tt1 = Factory.createTeamType();
      const tt2 = Factory.createTeamType();
      const event = Factory.createEvent({teamType_ids: [tt2._id, tt1._id]});

      const stt = event.sortedTeamTypes;
      assert.same(event.sortedTeamTypes, stt);
      assert.equals(event.sortedTeamTypes, [tt1, tt2]);

      event.$update('teamType_ids', [tt1._id]);
      assert.equals(event.$reload().sortedTeamTypes, [tt1]);
    });
  });
});
