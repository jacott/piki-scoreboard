define((require, exports, module) => {
  const koru            = require('koru');
  const IdleCheck       = require('koru/idle-check').singleton;
  const session         = require('koru/session');
  const webServer       = require('koru/web-server');
  const startup         = require('./startup-server');
  const bootstrap       = require('server/bootstrap');

  koru.onunload(module, 'reload');

  return async () => {
    await bootstrap();

    startup();

    process.on('SIGTERM', () => {
      console.log('Closing [SIGTERM]');
      webServer.stop();
      session.stop();
      IdleCheck.waitIdle(() => {
        console.log('=> Shutdown');
        process.exit(0);
      });
    });

    await webServer.start();

    console.log('=> Ready');
  };
});
