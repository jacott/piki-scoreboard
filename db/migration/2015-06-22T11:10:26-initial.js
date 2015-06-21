var fs =require('fs');

define(function(require, exports, module) {
  var util = require('koru/util');

  return function (mig) {
    mig.reversible({
      add: function (client) {
        client.query(fs.readFileSync(module.id.replace(/\/[^/]*$/, '/initial.sql')));
      },
      revert: function (client) {
        throw new Error('Initial migration can not be reverted');
      }
    });
  };

});
