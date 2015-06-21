define(function(require, exports, module) {
  var koru = require('koru/main-client');
  var startup = require('startup-client');

  require(module.config().extraRequires || [], function () {
    startup.start(module.config().extraRequires);
  });
});
