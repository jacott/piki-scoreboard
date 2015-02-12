define(function(require, exports, module) {
  var User = require('models/user');
  var UserAccount = require('koru/user-account');
  var Org = require('models/org');
  var Random = require('koru/random');
  var mongoDb = require('koru/mongo/driver');
  var Model = require('koru/model');

  return function () {
    initNewInstall();

    Model.ensureIndexes();
  };

  function initNewInstall() {
    if (User.query.count(1) === 0) {
      var id = Random.id();
      User.docs.insert({_id: id, name: "Super User", initials: "SU", email: "su@example.com", role: 's'});
      UserAccount.createUserLogin({email: "su@example.com", password: 'changeme', userId: id});
    }

    if (Org.query.count(1) === 0) {
      Org.create({name: 'Example org', shortName: 'EG', email: "su@example.com"});
    }
  }
});
