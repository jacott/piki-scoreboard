var path = require('path');

define(function(require, exports, module) {
  var koru = require('koru/main-server');
  var util = require('koru/util');
  var fileWatch = require('koru/file-watch');
  var test = require('koru/test');
  var Model = require('koru/model');
  var webServer = require('koru/web-server');

  require('koru/server');
  require('koru/server-rc');

  return function () {
    test.geddon.sinon.spy(Model._modelProperties, 'addUniqueIndex');
    test.geddon.sinon.spy(Model._modelProperties, 'addIndex');

    fileWatch.watch(path.join(koru.libDir, 'app/koru'), path.join(koru.libDir, 'app'));

    webServer.start();
    console.log('=> Ready');
  };
});
