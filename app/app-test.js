isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var App = require('./app');
  var env = require('koru/env');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      App.orgId = null;
      TH.clearDB();
      v = null;
    },


    "test Org": function () {
      refute(App.org());

      var org = TH.Factory.createOrg();
      App.orgId = org._id;

      assert.same(App.org(), org);
    },

    "test me": function () {
      var user = TH.Factory.createUser();

      refute(App.me());

      env.util.thread.userId = user._id;

      assert.same(App.me(), user);
    },
  });
});
