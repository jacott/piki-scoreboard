App.require('AppModel.User', function (model) {
  App.extend(model, {
    forgotPassword: function (email, callback) {
      Meteor.call("User.forgotPassword", email, callback);
    },
  });
});
