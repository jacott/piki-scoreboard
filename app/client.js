window.requirejs = window.yaajs;
define((require, exports, module)=>{
  const koru            = require('koru/main');
  const Model           = require('model');
  const startup         = require('startup-client');

  require(module.config().extraRequires || [], ()=>{
    startup.start(module.config().extraRequires);
  });
});
