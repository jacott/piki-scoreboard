define(function(require, exports, module) {
  var Model = require('koru/model');
  require('koru/model/validator!associated:generic:inclusion:length:required:text:unique');

  return Model;
});
