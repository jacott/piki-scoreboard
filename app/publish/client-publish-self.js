define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var env = require('koru/env');

  env.onunload(module, function () {
    publish._destroy('Self');
  });

  publish('Self', function () {
    var sub = this;

    sub.match('User', function (doc) {
      return sub.userId === doc._id;
    });

    sub.match('Org', function (doc) {
      return true;
    });
  });
});
