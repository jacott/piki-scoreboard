define(function(require, exports, module) {
  var koru = require('koru');
  var bootstrap = require('server/bootstrap');
  var startup = require('./startup-server');
  var webServer = require('koru/web-server');
  var session = require('koru/session');

  koru.onunload(module, 'reload');

  return function () {
    bootstrap();

    startup();

    process.on('SIGTERM', function () {
      console.log('Closing [SIGTERM]');
      webServer.stop();
      session.stop(function () {
        console.log('=> Shutdown ' + new Date());
        process.exit(0);
      });
    });

    webServer.start();
    console.log('=> Ready');
  };
});
