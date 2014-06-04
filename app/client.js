requirejs.config({
  packages: ['koru/model', 'koru/session', 'koru/user-account'],
});

define(function(require, exports, module) {
  var env =     require('koru/env');
  var startup = require('client-startup');
                require('koru/css/loader').loadAll('ui');

  env.onunload(module, function () {
    startup.stop();
    require([module.id], function () {});
  });

  startup.start();
});
