define(function(require, exports, module) {
  var koru = require('koru/server');
  var bootstrap = require('server/bootstrap');
  require('publish/publish-self');
  require('publish/publish-org');
  require('publish/publish-event');
  require('models/reg-upload-server');

  require('koru/email').initPool();

  koru.onunload(module, 'reload'); // FIXME maybe close all client connections instead

  return function () {
    bootstrap();
  };
});
