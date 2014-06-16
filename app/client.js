requirejs.config({
  packages: [
    "koru", "koru/model", "koru/session", "koru/user-account",
  ],
});

define(function(require, exports, module) {
  var koru =     require('koru');
  var startup = require('startup-client');
                require('koru/css/loader').loadAll('ui');

  koru.onunload(module, function (id, error) {
    startup.stop();
    if (! error)
      require([module.id], function () {});
  });

  startup.start();
});
