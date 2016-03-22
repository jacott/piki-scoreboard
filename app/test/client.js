window.requirejs = window.yaajs
window.yaajs.config({
  packages: [
    "koru", "koru/test", "koru/model", "koru/session", "koru/user-account",
  ],

  baseUrl: '/',
});

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');


define(function(require, exports, module) {
  var koru = require('koru/main-client');
  require('koru/session/main-client');

  koru.onunload(module, 'reload');

  require(['koru/session', 'koru/client'], function (session) {
    session.connect();
  });
});
