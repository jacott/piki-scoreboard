var path = require('path');

define(function(require, exports, module) {
  var util = require('koru/util');
  var koru = require('koru');
  var fileWatch = require('koru/file-watch');
  var test = require('koru/test');
  var Model = require('koru/model');

  require('koru/server');
  require('koru/server-rc');

  koru.Fiber(function () {
    test.geddon.sinon.spy(Model._modelProperties, 'addUniqueIndex');
    test.geddon.sinon.spy(Model._modelProperties, 'addIndex');

    fileWatch.watch(path.join(koru.libDir, 'app/koru'), path.join(koru.libDir, 'app'));
  }).run();
});
