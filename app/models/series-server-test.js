define((require, exports, module)=>{
  const util            = require('koru/util');
  const TH              = require('test-helper');

  const Series = require('./series');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let rpc, org, user;
    beforeEach(()=>{
      rpc = TH.mockRpc();
      org = TH.Factory.createOrg();
      user = TH.Factory.createUser();
    });

    afterEach(()=>{
      TH.clearDB();
    });

    group("authorize", ()=>{
      test("wrong org denied", ()=>{
        const oOrg = TH.Factory.createOrg();
        const oUser = TH.Factory.createUser();

        const series = TH.Factory.buildSeries();

        TH.noInfo();
        assert.accessDenied(()=>{
          series.authorize(user._id);
        });
      });

      test("allowed", ()=>{
        const series = TH.Factory.buildSeries();

        refute.accessDenied(()=>{
          series.authorize(user._id);
        });
      });

      test("permitParams", ()=>{
        const series = TH.Factory.buildSeries();

        series.attributes = series.changes;
        series.changes = {'name': 'new name'};
        assert.docChanges(series, {
          name: 'string',
          org_id: 'id',
          teamType_ids: ['id'],
          date: 'string',
          closed: TH.match(arg => {
            return arg.test(undefined)
              && arg.test(false) && ! arg.test([])
              && arg.test("f") && ! arg.test(1);
          }),
        }, ()=>{
          series.authorize(user._id);
        });

      });

      test("closing", ()=>{
        const series = TH.Factory.buildSeries();
        series.attributes = series.changes;
        series.changes = {closed: true};

        refute.accessDenied(()=>{
          series.authorize(user._id);
        });
      });

      test("change on closed", ()=>{
        const series = TH.Factory.buildSeries({closed: true});
        series.attributes = series.changes;
        series.changes = {name: 'bob'};

        TH.noInfo();
        assert.accessDenied(()=>{
          series.authorize(user._id);
        });
      });

      test("opening", ()=>{
        const series = TH.Factory.buildSeries({closed: false});
        series.attributes = series.changes;
        series.changes = {closed: 'true'};

        refute.accessDenied(()=>{
          series.authorize(user._id);
        });
      });
    });
  });
});
