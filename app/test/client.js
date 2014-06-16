requirejs.config({
  packages: [
    "koru", "koru/test", "koru/model", "koru/session", "koru/user-account",
  ],

  baseUrl: '/',
});

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');


define(function(require, exports, module) {
  require('koru/session/main-client');
  var koru = require('koru');

  koru.onunload(module, 'reload');

  require(['koru/session', 'koru/client'], function (session) {
    session.connect();
  });
});
