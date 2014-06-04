define(function(require, exports, module) {
  var util = require('koru/util');
  var session = require('koru/session');

  return function (model) {
    util.extend(model, {
      forgotPassword: function (email, callback) {
        session.rpc("User.forgotPassword", email, callback);
      },
    });
  };
});
