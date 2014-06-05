define(function(require, exports, module) {
  var Org = require('models/org');
  var User = require('models/user');
  var env = require('koru/env');
  var Dom = require('koru/dom');

  var App = {
    org: function () {
      return App.orgId && Org.findById(App.orgId);
    },

    me: function () {
      return User.me();
    },

    setAccess: function() {
      var _id = env.userId();
      var user = _id && User.findById(_id);
      Dom.setClassBySuffix(user ? user.accessClasses(App.orgId) : 'readOnly', 'Access', document.body);
    },
  };

  return App;
});