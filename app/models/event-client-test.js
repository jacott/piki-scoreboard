define((require, exports, module)=>{
  const TH              = require('test-helper');

  const sut = require('./event');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("sortedTeamTypes", ()=>{
      const tt1 = TH.Factory.createTeamType();
      const tt2 = TH.Factory.createTeamType();
      const event = TH.Factory.createEvent({teamType_ids: [tt2._id, tt1._id]});

      const stt = event.sortedTeamTypes;
      assert.same(event.sortedTeamTypes, stt);
      assert.equals(event.sortedTeamTypes, [tt1, tt2]);

      event.$update('teamType_ids', [tt1._id]);
      assert.equals(event.$reload().sortedTeamTypes, [tt1]);
    });
  });
});
