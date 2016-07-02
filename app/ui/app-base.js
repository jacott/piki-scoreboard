define(function(require, exports, module) {
  const koru         = require('koru');
  const Dom          = require('koru/dom');
  const Org          = require('models/org');
  const User         = require('models/user');

  var App = {
    org() {
      return App.orgId && Org.findById(App.orgId);
    },

    me() {
      return User.me();
    },

    setAccess() {
      var _id = koru.userId();
      var user = _id && User.findById(_id);
      Dom.setClassBySuffix(user ? user.accessClasses(App.orgId) : 'readOnly', 'Access', document.body);
    },
  };

  return App;
});
