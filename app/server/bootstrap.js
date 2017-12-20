const path = require('path');
define(function(require, exports, module) {
  const koru            = require('koru');
  const DBDriver        = require('koru/config!DBDriver');
  const Migration       = require('koru/migrate/migration');
  const Model           = require('koru/model');
  const Random          = require('koru/random');
  const UserAccount     = require('koru/user-account');
  const Org             = require('models/org');
  const User            = require('models/user');

  function initNewInstall() {
    if (User.query.count(1) === 0) {
      const id = Random.id();
      User.docs.insert({_id: id, name: "Super User", initials: "SU", email: "su@example.com", role: 's'});
      UserAccount.createUserLogin({email: "su@example.com", password: 'changeme', userId: id});
    }

    if (Org.query.count(1) === 0) {
      Org.create({name: 'Example org', shortName: 'EG', email: "su@example.com"});
    }
  }

  return ()=>{
    DBDriver.isPG && new Migration(DBDriver.defaultDb).migrateTo(path.resolve(koru.appDir, '../db/migrate'), '~');
    initNewInstall();

    Model.ensureIndexes();
  };
});
