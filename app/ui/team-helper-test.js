define(function (require, exports, module) {
  var test, v;
  const TH     = require('test-helper');
  const sut    = require('./team-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      sut.teamType_id = undefined;
      v = null;
    },

    "test setSeriesTeamType"() {
      const club = TH.Factory.createTeamType({_id: 'club', name: 'club'});
      const co = TH.Factory.createTeamType({_id: 'co', name: 'country'});
      const sch = TH.Factory.createTeamType({_id: 'sch', name: 'school', default: true});
      const series = TH.Factory.createSeries({teamType_ids: ['club', 'sch']});

      sut.setSeriesTeamType(series, co);

      assert.same(sut.teamType_id, 'sch');
    },
  });
});
