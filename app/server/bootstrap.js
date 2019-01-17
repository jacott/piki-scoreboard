const path = require('path');
define((require)=>{
  const koru            = require('koru');
  const DBDriver        = require('koru/config!DBDriver');
  const Migration       = require('koru/migrate/migration');
  const Model           = require('koru/model');
  const Random          = require('koru/random');
  const UserAccount     = require('koru/user-account');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');

  const initNewInstall = ()=>{
    if (User.query.count(1) === 0) {
      const id = Random.id();
      User.docs.insert({_id: id, name: "Super User", initials: "SU", email: "su@example.com"});
      UserAccount.createUserLogin({email: "su@example.com", password: 'changeme', userId: id});
      Role.docs.insert({_id: id, user_id: id, org_id: null, role: "s"});

      Org.create({name: 'Example org', shortName: 'EG', email: "su@example.com"});
    }
  };

  return ()=>{
    DBDriver.isPG && new Migration(DBDriver.defaultDb)
      .migrateTo(path.resolve(koru.appDir, '../db/migrate'), '~');
    initNewInstall();
  };
});
