define(function(require, exports, module) {
  var userAccount = require('koru/user-account');
  var session = require('koru/session');
  var client = require('koru/client');
  var App = require('ui/app');
  require('ui/profile');
  require('ui/club');
  require('ui/climber');
  require('ui/category');
  require('ui/event-category');
  require('ui/event-register');

  return {
    start: function () {
      userAccount.init();
      session.connect();
      App.start();
    },

    stop: function () {
      App.stop();
      session.stop();
      userAccount.stop();
    },
  };
});
