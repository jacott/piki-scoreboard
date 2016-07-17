define(function (require, exports, module) {
  var test, v;
  const koru  = require('koru');
  const TH    = require('test-helper');
  const Event = require('./event');
  const Org   = require('./org');
  const User  = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.rpc = TH.mockRpc();
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test wrong org denied"() {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var event = TH.Factory.buildEvent();

        assert.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var event = TH.Factory.buildEvent();

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test series_id"() {
        const ev = TH.Factory.createEvent();
        ev.changes.series_id = 'bad';

        assert.accessDenied(() => ev.authorize(v.user._id));

        ev.changes.series_id = TH.Factory.createSeries()._id;
        ev.authorize(v.user._id);

        const org = TH.Factory.createOrg();
        ev.changes.series_id = TH.Factory.createSeries()._id;
        assert.accessDenied(() => ev.authorize(v.user._id));
      },

      'test permitParams'() {
        var event = TH.Factory.buildEvent();

        event.attributes = event.changes;
        event.changes = {'name': 'new name'};
        assert.docChanges(event, {
          name: 'string',
          teamType_ids: ['id'],
          date: 'string',
          closed: TH.match(arg => {
            return arg.$test(undefined)
              && arg.$test(false) && ! arg.$test([])
              && arg.$test("f") && ! arg.$test(1);
          }),
          heats: 'baseObject',
          series_id: 'id',
        }, {
          _id: 'id',
          org_id: 'id',
        }, function () {
          event.authorize(v.user._id);
        });

      },

      "test closing"() {
        var event = TH.Factory.buildEvent();
        event.attributes = event.changes;
        event.changes = {closed: true, name: 'new Name'};

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test change on closed"() {
        var event = TH.Factory.buildEvent({closed: true});
        event.attributes = event.changes;
        event.changes = {name: 'bob'};

        assert.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test opening"() {
        var event = TH.Factory.buildEvent({closed: false});
        event.attributes = event.changes;
        event.changes = {closed: 'true'};

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },
    },
  });
});
