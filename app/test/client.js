window.requirejs = window.yaajs;

window.history.replaceState(null, document.title = 'Piki Test Mode', '/');

define((require, exports, module)=>{
  const koru            = require('koru/main');
  const Model           = require('model');

  require('koru/test/client');
  koru.onunload(module, 'reload');
});
