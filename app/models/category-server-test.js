define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Category = require('./category');
  var koru = require('koru');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied": function () {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var category = TH.Factory.buildCategory();

        test.stub(koru, 'info');
        assert.accessDenied(function () {
          category.authorize(v.user._id);
        });
      },

      "test allowed": function () {
        var category = TH.Factory.buildCategory();

        refute.accessDenied(function () {
          category.authorize(v.user._id);
        });
      },
    },
  });
});
