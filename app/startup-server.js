define(function(require, exports, module) {
  var env = require('koru/server');
  var bootstrap = require('server/bootstrap');
  require('publish/publish-self');
  require('publish/publish-org');
  require('publish/publish-event');

  env.onunload(module, 'reload'); // FIXME maybe close all client connections instead

  return function () {
    bootstrap();
  };
});
