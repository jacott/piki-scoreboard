window.requirejs = window.yaajs;

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');


define(function(require, exports, module) {
  var koru = require('koru/main-client');
  require('koru/test/client');
  koru.onunload(module, 'reload');
});
