var path = require('path');
define(function(require, exports, module) {
  var User = require('models/user');
  var UserAccount = require('koru/user-account');
  var Org = require('models/org');
  var Random = require('koru/random');
  var DBDriver = require('koru/config!DBDriver');
  var mongoDriver = require('koru/mongo/driver');
  var Model = require('koru/model');
  var Migration = require('koru/migrate/migration');
  var util = require('koru/util');
  var koru = require('koru');

  return function () {
    DBDriver.isPG && Migration.migrateTo(DBDriver.defaultDb, path.resolve(koru.appDir, '../db/migration'), 'zz');
    // initNewInstall();

    migrateMongo();

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

  function migrateMongo() {
    User.docs.transaction(function (tx) {
      if (User.exists({})) return;

      console.log("\n*** MIGRATING ***");

      var totalWrite =0;

      var mongoDb = mongoDriver.defaultDb;
      var pgDb = DBDriver.defaultDb;
      var allst = process.hrtime();
      for (var name in Model) {
        var st = process.hrtime();
        var ptable = Model[name].docs;
        ptable._ensureTable();
        var mtable  = mongoDb.table(name);
        var colNames = ptable._columns.map(function (col) {return col.column_name});
        console.log("\n"+name,
                    colNames.map(function (col) {return col+'::'+ptable.dbType(col)})+')');

        pgDb.prepare('pins', 'INSERT INTO "'+name+'" ('+
                     colNames.map(function (col) {return '"'+col+'"'})+
                     ') VALUES ('+colNames.map(function (col, i) {return '$'+(i+1)+'::'+ptable.dbType(col)})+')');

        var count = 0;
        mtable.find({}).forEach(function (row) {
          row._id = row._id.toString();
          ++count;
          try {
            pgDb.execPrepared('pins', ptable.values(row, colNames));
          } catch(ex) {
            koru.error('row', row._id.length, util.inspect(row));

            throw ex;
          }
          ++totalWrite;
        });
        pgDb.query('DEALLOCATE pins');
        st = process.hrtime(st);
        koru.info(name+' loaded '+count+' rows in  ' + st[0] + '.' + (1e9 + st[1]).toString().slice(1,4)+'s\n');
      }

      st = process.hrtime(allst);
      koru.info('*** finished migrated ' + totalWrite + ' records in  ' + st[0] + '.' + (1e9 + st[1]).toString().slice(1,4)+'s\n');
      mongoDriver.closeDefaultDb();
    });
  }
});
