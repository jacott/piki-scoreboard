define(function(require, exports, module) {
  var koru = require('koru');
  var bootstrap = require('server/bootstrap');
  var startup = require('./startup-server');
  var webServer = require('koru/web-server');

  koru.onunload('reload');

  return function () {
    bootstrap();

    startup();

    webServer.start();
    console.log('=> Ready');
  };
});
