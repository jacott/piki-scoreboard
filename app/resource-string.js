define(function(require, exports, module) {
  const format = require('koru/format');
  const base   = require('koru/resource-string');
  const util   = require('koru/util');

  util.extend(base.en, {
    unsupported_import_format:  'The uploaded file is unsupported',
  });

  base.text = function (text) {
    var m = /^([^:]+):(.*)$/.exec(text);
    if (m) {
      var fmt = base.en[m[1]];
      if (fmt) {
        return format(fmt, m[2].split(':'));
      }
    }
    return base.en[text] || text;
  };

  return base;
});
