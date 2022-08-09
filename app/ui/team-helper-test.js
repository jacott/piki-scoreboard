define((require, exports, module) => {
  'use strict';
  const sut             = require('./team-helper');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(() => {TH.startTransaction()});

    afterEach(() => {
      sut.teamType_id = undefined;
      TH.rollbackTransaction();
    });

    test('setSeriesTeamType', () => {
      const club = Factory.createTeamType({_id: 'club', name: 'club'});
      const co = Factory.createTeamType({_id: 'co', name: 'country'});
      const sch = Factory.createTeamType({_id: 'sch', name: 'school', default: true});
      const series = Factory.createSeries({teamType_ids: ['club', 'sch']});

      sut.setSeriesTeamType(series, co);

      assert.same(sut.teamType_id, 'sch');
    });
  });
});
