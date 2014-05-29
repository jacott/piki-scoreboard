define(function(require, exports, module) {
  var User = require('models/user');
  var UserAccount = require('koru/user-account/server-main');


  return function () {
    if (User.query.count(1) === 0) {
      var user = User.build({name: "Super User", initials: "SU", email: "su@example.com", role: 's'});
      user.$save('force');
      UserAccount.createUserLogin({email: user.email, password: 'changeme', userId: user._id});
    }
  };
});
