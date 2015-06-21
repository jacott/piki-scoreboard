define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Event = require('./event');
  var Org = require('./org');
  var User = require('./user');
  var koru = require('koru');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.rpc = TH.mockRpc();
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test wrong org denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var event = TH.Factory.buildEvent();

        assert.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var event = TH.Factory.buildEvent();

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      'test permitParams': function () {
        var event = TH.Factory.buildEvent();

        event.attributes = event.changes;
        event.changes = {'name': 'new name'};
        assert.docChanges(event, {
          name: 'string',
          org_id: 'string',
          date: 'string',
          closed: TH.match.any,
          heats: 'object',
        }, function () {
          event.authorize(v.user._id);
        });

      },

      "test closing": function () {
        var event = TH.Factory.buildEvent();
        event.attributes = event.changes;
        event.changes = {closed: true};

        refute.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test change on closed": function () {
        var event = TH.Factory.buildEvent({closed: true});
        event.attributes = event.changes;
        event.changes = {name: 'bob'};

        assert.accessDenied(function () {
          event.authorize(v.user._id);
        });
      },

      "test opening": function () {
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
