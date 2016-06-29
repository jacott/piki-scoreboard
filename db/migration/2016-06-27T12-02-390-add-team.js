define(function(require, exports, module) {
  const Random = require('koru/random');

  return function (mig) {
    mig.createTable('TeamType', {
      org_id: {type: 'varchar(24)'},
      name: {type: 'text'},
    });

    mig.createTable('Team', {
      org_id: {type: 'varchar(24)'},
      teamType_id: {type: 'varchar(24)'},
      name: {type: 'text'},
      shortName: {type: 'text'},
    });

    mig.reversible({
      add(client) {
        client.query('select _id from "Org"').forEach(item => {
          client.query('insert into "TeamType" (_id, org_id, name) values ($1, $2, $3)', [Random.id(), item._id, 'Club']);
        });
      },
    });

  };
});
