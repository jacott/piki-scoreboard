requirejs.config({
  packages: [
    "koru/test", "koru/model", "koru/session",
  ],

  baseUrl: '/',
});

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');


define(function(require, exports, module) {
  var env = require('koru/env');
  var client = require('koru/client');

  env.onunload(module, 'reload');
});
