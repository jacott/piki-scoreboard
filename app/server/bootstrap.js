const path = require('path');
define((require) => {
  const koru            = require('koru');
  const DBDriver        = require('koru/config!DBDriver');
  const Migration       = require('koru/migrate/migration');
  const Model           = require('koru/model');
  const Random          = require('koru/random');
  const UserAccount     = require('koru/user-account');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');

  const initNewInstall = async () => {
    if ((await User.query.count(1)) === 0) {
      const id = Random.id();
      await User.docs.insert({_id: id, name: 'Super User', initials: 'SU', email: 'su@example.com'});
      await UserAccount.createUserLogin({email: 'su@example.com', password: 'changeme', userId: id});
      await Role.docs.insert({_id: id, user_id: id, org_id: null, role: 's'});

      await Org.create({name: 'Example org', shortName: 'EG', email: 'su@example.com'});
    }
  };

  return async () => {
    await new Migration(DBDriver.defaultDb).migrateTo(path.resolve(koru.appDir, '../db/migrate'), '~');
    await initNewInstall();
  };
});
