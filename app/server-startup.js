define(function(require, exports, module) {
  var env = require('koru/server');
  var bootstrap = require('server/bootstrap');
  require('publish/server-publish-self');
  require('publish/server-publish-org');

  env.onunload(module, 'reload'); // FIXME maybe close all client connections instead

  return function () {
    bootstrap();
  };
});
