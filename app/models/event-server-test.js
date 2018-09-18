define((require, exports, module)=>{
  const koru            = require('koru');
  const TH              = require('test-helper');
  const Event           = require('./event');
  const Org             = require('./org');
  const User            = require('./user');

  const {stub, spy, onEnd} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let org, user;
    beforeEach(()=>{
      org = TH.Factory.createOrg();
      user = TH.Factory.createUser();
      TH.noInfo();
    });

    afterEach(()=>{
      TH.clearDB();
    });

    group("authorize", ()=>{
      test("wrong org denied", ()=>{
        const oOrg = TH.Factory.createOrg();
        const oUser = TH.Factory.createUser();

        const event = TH.Factory.buildEvent();

        assert.accessDenied(()=>{
          event.authorize(user._id);
        });
      });

      test("allowed", ()=>{
        const event = TH.Factory.buildEvent();

        refute.accessDenied(()=>{
          event.authorize(user._id);
        });
      });

      test("series_id", ()=>{
        const ev = TH.Factory.createEvent();
        ev.changes.series_id = 'bad';

        assert.accessDenied(() => ev.authorize(user._id));

        ev.changes.series_id = TH.Factory.createSeries()._id;
        ev.authorize(user._id);

        const org = TH.Factory.createOrg();
        ev.changes.series_id = TH.Factory.createSeries()._id;
        assert.accessDenied(() => ev.authorize(user._id));
      });

      test("permitParams", ()=>{
        const event = TH.Factory.buildEvent();

        event.attributes = event.changes;
        event.changes = {'name': 'new name'};
        assert.docChanges(event, {
          name: 'string',
          ruleVersion: 'number',
          teamType_ids: ['id'],
          date: 'string',
          closed: TH.match(arg => {
            return arg.test(undefined)
              && arg.test(false) && ! arg.test([])
              && arg.test("f") && ! arg.test(1);
          }),
          heats: 'baseObject',
          series_id: 'id',
        }, {
          _id: 'id',
          org_id: 'id',
        }, ()=>{
          event.authorize(user._id);
        });

      });

      test("closing", ()=>{
        const event = TH.Factory.buildEvent();
        event.attributes = event.changes;
        event.changes = {closed: true, name: 'new Name'};

        refute.accessDenied(()=>{
          event.authorize(user._id);
        });
      });

      test("change on closed", ()=>{
        const event = TH.Factory.buildEvent({closed: true});
        event.attributes = event.changes;
        event.changes = {name: 'bob'};

        assert.accessDenied(()=>{
          event.authorize(user._id);
        });
      });

      test("opening", ()=>{
        const event = TH.Factory.buildEvent({closed: false});
        event.attributes = event.changes;
        event.changes = {closed: 'true'};

        refute.accessDenied(()=>{
          event.authorize(user._id);
        });
      });
    });
  });
});
