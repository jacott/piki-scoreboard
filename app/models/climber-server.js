define((require) => {
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const util            = require('koru/util');
  const ChangeLog       = require('./change-log');
  const User            = require('./user');
  const Model           = require('model');
  const Role            = require('models/role');

  const FIELD_SPEC = {
    name: 'string',
    dateOfBirth: 'string',
    gender: 'string',
    number: 'number',
    disabled: 'boolean',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    org_id: 'id',
  };

  return (Climber) => {
    ChangeLog.logChanges(Climber);

    Climber.registerObserveField('org_id');

    Climber.remote({
      async merge(climberId, ids) {
        Val.assertCheck(climberId, 'id');
        Val.assertCheck(ids, ['id']);

        const climber = await Climber.findById(climberId);

        await climber.authorize(this.userId);

        const db = Climber.db;
        const params = {
          dest_id: climberId,
          ids,
          org_id: climber.org_id,
        };

        await db.transaction(async () => {
          Val.allowAccessIf((await db.query(
            'select count(*) from "Climber" where _id = ANY({$ids}) and org_id = {$org_id}',
            params,
          ))[0].count == ids.length);

          for (const table of ['Competitor', 'Result']) {
            await db.query(
              `update "${table}" set climber_id = {$dest_id} where climber_id = ANY({$ids})`,
              params,
            );
          }
          await db.query(
            'delete from "Climber" where _id = ANY({$ids})',
            params,
          );
        });

        for (let key in session.conns) {
          const conn = session.conns[key];
          if (conn.org_id === climber.org_id) {
            conn.sendBinary('B', ['mergeClimbers', climberId, ids]);
          }
        }
      },

      async clearAllNumbers(org_id) {
        Val.assertCheck(org_id, 'id');
        Val.allowAccessIf(/[as]/.test((await Role.readRole(this.userId, org_id)).role));
        for await (const doc of Climber.where('org_id', org_id).whereNot('number', null)) {
          doc.$update('number', null);
        }
      },
    });

    util.merge(Climber.prototype, {
      async authorize(userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        await User.fetchAdminister(userId, this);

        if (options?.remove) {
          Val.allowAccessIf(! await Model.Competitor.exists({climber_id: this._id}));
        }
      },
    });
  };
});
