requirejs.config({
  packages: ['koru/model', 'koru/session'],
});

define(function(require, exports, module) {
                require('koru/css/loader').loadAll('ui');
  var env =     require('koru/client');
  var App = require('ui/app');

  env.onunload(module, function () {
    App.stop();
    require([module.id], function () {});
  });

  App.start();
});
