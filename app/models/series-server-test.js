define(function (require, exports, module) {
  var test, v;
  const util       = require('koru/util');
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
