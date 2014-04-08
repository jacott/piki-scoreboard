App.require('AppModel.User', function (model) {
  App.extend(model, {
    forgotPassword: function (email, callback) {
      App.rpc("User.forgotPassword", email, callback);
    },
  });
});
