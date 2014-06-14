requirejs.config({
  packages: [
    "koru/model", "koru/session", "koru/user-account",
  ],
});

define(function(require, exports, module) {
  var env =     require('koru/env');
  var startup = require('startup-client');
                require('koru/css/loader').loadAll('ui');

  env.onunload(module, function (id, error) {
    startup.stop();
    if (! error)
      require([module.id], function () {});
  });

  startup.start();
});
