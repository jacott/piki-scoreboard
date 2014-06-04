requirejs.config({
  packages: [
    "koru/test", "koru/model", "koru/session", "koru/user-account",
  ],

  baseUrl: '/',
});

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');


define(function(require, exports, module) {
  var env = require('koru/client');
  var session = require('koru/session');

  env.onunload(module, 'reload');

  session.connect();
});
