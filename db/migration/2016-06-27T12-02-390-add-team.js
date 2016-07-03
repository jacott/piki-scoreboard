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
        client.query('alter table "Competitor" add column team_ids varchar(24)[]');
        client.query('alter table "Event" add column "teamType_ids" varchar(24)[]');
        client.query('alter table "Climber" add column "team_ids" varchar(24)[]');

        client.query('select _id from "Org"').forEach(item => {
          let id = Random.id();
          client.query('insert into "TeamType" (_id, org_id, name) values ($1, $2, $3)', [id, item._id, 'Club']);

          client.query('update "Event" set "teamType_ids" = $2 where org_id = $1', [item._id, client.aryToSqlStr([id])]);
          client.query('select * from "Club" where org_id = $1', [item._id]).forEach(club => {
            client.query('insert into "Team" (_id, org_id, "teamType_id", name, "shortName") values ($1, $2, $3, $4, $5)',
                         [club._id, item._id, id, club.name, club.shortName]);
          });
        });

        client.query('update "Climber" set "team_ids" = array[club_id]');
        client.query('update "Competitor" as co set "team_ids" = array[cl.club_id] from "Climber" as cl where cl._id = co.climber_id');
      },

      revert(client) {
        client.query('alter table "Competitor" drop column team_ids');
        client.query('alter table "Climber" drop column team_ids');
        client.query('alter table "Event" drop column "teamType_ids"');
      },
    });

  };
});
