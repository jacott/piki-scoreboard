define(function(require, exports, module) {
  const koru         = require('koru');
  const Dom          = require('koru/dom');
  const localStorage = require('koru/local-storage');
  const Org          = require('models/org');
  const User         = require('models/user');

  var App = {
    org: function () {
      if (App.orgId === undefined) {
        App.orgId = localStorage.getItem('orgId') || null;
      }
      return App.orgId && Org.findById(App.orgId);
    },

    me: function () {
      return User.me();
    },

    setAccess: function() {
      var _id = koru.userId();
      var user = _id && User.findById(_id);
      Dom.setClassBySuffix(user ? user.accessClasses(App.orgId) : 'readOnly', 'Access', document.body);
    },
  };

  return App;
});
