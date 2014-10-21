define(function(require, exports, module) {
  var koru = require('koru');
  var bootstrap = require('server/bootstrap');

  koru.onunload('reload');

  return function () {
    bootstrap();

    requirejs(['startup-server'], function (startup) {
      koru.Fiber(startup).run();
    });
  };
});
