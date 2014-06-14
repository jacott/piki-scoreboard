requirejs.config({
  packages: [
    "koru/test", "koru/model", "koru/session", "koru/user-account",
  ],

  baseUrl: '/',
});

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');


define(function(require, exports, module) {
  require('koru/session/main-client');
  var env = require('koru/env');

  env.onunload(module, 'reload');

  require(['koru/session', 'koru/client'], function (session) {
    session.connect();
  });
});
