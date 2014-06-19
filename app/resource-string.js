define(function(require, exports, module) {
  var base = require('koru/resource-string');
  var util = require('koru/util');

  util.extend(base.en, {
    unsupported_import_format:  'The uploaded file is unsupported',
  });

  return base;
});
