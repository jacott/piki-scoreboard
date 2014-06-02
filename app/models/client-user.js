define(function(require, exports, module) {
  var model = require('./user');
  var util = require('koru/util');
  var session = require('koru/session');

  util.extend(model, {
    forgotPassword: function (email, callback) {
      session.rpc("User.forgotPassword", email, callback);
    },
  });

  return model;
});
