requirejs.config({
  packages: ['koru/model', 'koru/session'],
});

define(function(require, exports, module) {
                require('koru/css/loader').loadAll('ui');
  var env =     require('koru/client');
  var startup = require('client-startup');

  env.onunload(module, function () {
    startup.stop();
    require([module.id], function () {});
  });

  startup.start();
});
