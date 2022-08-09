define((require, exports, module) => {
  const util            = require('koru/util');
  const Climber         = require('./climber');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Category = require('./category');
  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => TH.startTransaction());
    afterEach(() => TH.rollbackTransaction());

    test('groupApplicable', () => {
      const gB1 = Factory.createCategory({group: 'B'});
      const gA1 = Factory.createCategory({group: 'A'});
      const gA2 = Factory.createCategory({group: 'A'});

      const climber = Factory.createClimber();

      Factory.createOrg();

      const other = Factory.createCategory({group: 'A'});

      const result = {A: [], B: []};

      Category.groupApplicable(climber, (group, docs) => {
        result[group].push(util.mapField(docs));
      });

      assert.equals(result, {A: [[gA1._id, gA2._id]], B: [[gB1._id]]});
    });
  });
});
