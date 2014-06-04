define(function(require, exports, module) {
  var userAccount = require('koru/user-account/client-main');
  var session = require('koru/session/client-main');
  var client = require('koru/client');
  var App = require('ui/app');

  return {
    start: function () {
      userAccount.init();
      session.connect();
      App.start();
    },

    stop: function () {
      App.stop();
      session.disconnect();
      userAccount.stop();
    },
  };
});
