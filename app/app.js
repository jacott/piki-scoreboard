define(function(require, exports, module) {
  var makeSubject = require('koru/make-subject');
  var User = require('models/user');
  var Org = require('models/org');

  var App = {
    org: function () {
      return App.orgId && Org.findById(App.orgId);
    },

    me: function () {
      return User.me();
    },
  };
  return App;
});
