define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Competitor = require('./competitor');
  var koru = require('koru');
  var Event = require('./event');
  var User = require('./user');
  var Val = require('koru/model/validation');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.event = TH.Factory.createEvent();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');

      test.stub(Val, 'ensureString');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oEvent = TH.Factory.createEvent();
        var oUser = TH.Factory.createUser();

        var competitor = TH.Factory.buildCompetitor();

        assert.accessDenied(function () {
          competitor.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var competitor = TH.Factory.buildCompetitor();

        refute.accessDenied(function () {
          competitor.authorize(v.user._id);
        });

        assert.calledWith(Val.ensureString, v.event._id);
      },
    },

  });
});
