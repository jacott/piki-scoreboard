define(function(require, exports, module) {
  var startup = require('startup-client');

  require(module.config().extraRequires || [], function () {
    startup.start(module.config().extraRequires);
  });
});
