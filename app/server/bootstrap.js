var path = require('path');
define(function(require, exports, module) {
  var User = require('models/user');
  var UserAccount = require('koru/user-account');
  var Org = require('models/org');
  var Random = require('koru/random');
  var DBDriver = require('koru/config!DBDriver');
  var Model = require('koru/model');
  var Migration = require('koru/migrate/migration');
  var util = require('koru/util');
  var koru = require('koru');

  return function () {
    DBDriver.isPG && new Migration(DBDriver.defaultDb).migrateTo(path.resolve(koru.appDir, '../db/migration'), 'zz');
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
