define(function (require, _, module) {
  var test, v;
  const util       = require('koru/util');
  const Result     = require('models/result');
  const TH         = require('test-helper');
  const Series     = require('./series');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.rpc = TH.mockRpc();
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();

    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test results rpc"() {
      TH.loginAs(v.user);
      const climbers = TH.Factory.createList(3, 'createClimber', (index, options) => options._id = 'cl'+index);
      const cats = TH.Factory.createList(2, 'createCategory', (index, options) => options._id = 'cat'+index);
      const series = TH.Factory.createSeries();
      const ev1 = TH.Factory.createEvent({_id: 'ev1', series_id: series._id, heats: {[cats[0]._id]: 'LF4', [cats[1]._id]: 'BF6'}});
      const ev2 = TH.Factory.createEvent({_id: 'ev2', series_id: series._id, heats: {[cats[1]._id]: 'BF3'}});

      const evOther = TH.Factory.createEvent();
      [{
        scores: [0.4, 100], climber_id: climbers[0]._id,
      }, {
        scores: [0.1, 99], climber_id: climbers[2]._id,
      }, {
        scores: [0.6, 99], climber_id: climbers[1]._id,
      }].forEach(attrs => {
        const competitor_id = TH.Factory.createCompetitor({event_id: ev1._Id, climber_id: attrs.climber_id})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev1._id, category_id: cats[0]._id}));
      });

      [{
        scores: [0.4, 100], climber_id: climbers[1]._id,
      }, {
        scores: [0.1, 99], climber_id: climbers[0]._id,
      }, {
        scores: [0.6, 99], climber_id: climbers[2]._id,
      }].forEach(attrs => {
        const competitor_id = TH.Factory.createCompetitor({event_id: ev1._Id, climber_id: attrs.climber_id})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev1._id, category_id: cats[1]._id}));
      });

      [{
        scores: [0.4, 50], climber_id: climbers[1]._id,
      }, {
        scores: [0.6, 50], climber_id: climbers[2]._id,
      }].forEach(attrs => {
        const competitor_id = TH.Factory.createCompetitor({event_id: ev1._Id, climber_id: attrs.climber_id})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev2._id, category_id: cats[1]._id}));
      });


      let ans = v.rpc('Series.results', series._id);

      assert.equals(ans, [{
        event_id: ev1._id,
        cats: cats.map((cat, index) => {
          return {
            category_id: cat._id,
            fmt: ev1.heats[cat._id],
            results: [[climbers[(0+index) % 3]._id, 100], [climbers[(2+index) % 3]._id, 72], [climbers[(1+index) % 3]._id, 72]]
          };
          }),
      }, {
        event_id: ev2._id,
        cats: [{
          category_id: cats[1]._id,
          fmt: ev2.heats[cats[1]._id],
          results: [[climbers[1]._id, 90], [climbers[2]._id, 90]]
        }],
      }]);
    },

    "authorize": {
      "test wrong org denied"() {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var series = TH.Factory.buildSeries();

        TH.noInfo();
        assert.accessDenied(function () {
          series.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var series = TH.Factory.buildSeries();

        refute.accessDenied(function () {
          series.authorize(v.user._id);
        });
      },

      'test permitParams'() {
        var series = TH.Factory.buildSeries();

        series.attributes = series.changes;
        series.changes = {'name': 'new name'};
        assert.docChanges(series, {
          name: 'string',
          org_id: 'id',
          teamType_ids: ['id'],
          date: 'string',
          closed: TH.match(arg => {
            return arg.$test(undefined)
              && arg.$test(false) && ! arg.$test([])
              && arg.$test("f") && ! arg.$test(1);
          }),
        }, function () {
          series.authorize(v.user._id);
        });

      },

      "test closing"() {
        var series = TH.Factory.buildSeries();
        series.attributes = series.changes;
        series.changes = {closed: true};

        refute.accessDenied(function () {
          series.authorize(v.user._id);
        });
      },

      "test change on closed"() {
        var series = TH.Factory.buildSeries({closed: true});
        series.attributes = series.changes;
        series.changes = {name: 'bob'};

        TH.noInfo();
        assert.accessDenied(function () {
          series.authorize(v.user._id);
        });
      },

      "test opening"() {
        var series = TH.Factory.buildSeries({closed: false});
        series.attributes = series.changes;
        series.changes = {closed: 'true'};

        refute.accessDenied(function () {
          series.authorize(v.user._id);
        });
      },
    }
  });
});
