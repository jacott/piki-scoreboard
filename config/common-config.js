var path = require('path');
var appDir = path.resolve(__dirname, '../app');

exports.common = function (cfg) {
  cfg.merge('requirejs.packages', [
    "koru/model", "koru/user-account",
  ]);

};

exports.client = function (cfg) {
};

exports.server = function (cfg) {
  cfg.set('requirejs.baseUrl', appDir);
  cfg.set('requirejs.nodeRequire', require);
};
