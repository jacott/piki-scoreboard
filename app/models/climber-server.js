define((require)=>{
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const util            = require('koru/util');
  const Model           = require('model');
  const Role            = require('models/role');
  const ChangeLog       = require('./change-log');
  const User            = require('./user');

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

  return Climber =>{
    ChangeLog.logChanges(Climber);

    Climber.registerObserveField('org_id');

    Climber.remote({
      merge(climberId, ids) {
        Val.assertCheck(climberId, 'id');
        Val.assertCheck(ids, ['id']);

        const climber = Climber.findById(climberId);

        climber.authorize(this.userId);

        const db = Climber.db;
        const params = {
          dest_id: climberId,
          ids: Climber.db.aryToSqlStr(ids),
          org_id: climber.org_id,
        };


        db.transaction(() => {
          Val.allowAccessIf(db.query(
            'select count(*) from "Climber" where _id = ANY({$ids}) and org_id = {$org_id}',
            params
          )[0].count == ids.length);
          ['Competitor', 'Result'].forEach(table => {
            db.query(
              `update "${table}" set climber_id = {$dest_id} where climber_id = ANY({$ids})`,
              params
            );
          });
          db.query(
            'delete from "Climber" where _id = ANY({$ids})',
            params
          );
        });

        for (let key in session.conns) {
          const conn = session.conns[key];
          if (conn.org_id === climber.org_id)
            conn.sendBinary('B', ['mergeClimbers', climberId, ids]);
        }
      },

      clearAllNumbers(org_id) {
        Val.assertCheck(org_id, 'id');
        Val.allowAccessIf(/[as]/.test(Role.readRole(this.userId, org_id).role));
        Climber.where('org_id', org_id).whereNot('number', null).forEach(doc => {
          doc.$update('number', null);
        });
      },
    });

    util.merge(Climber.prototype, {
      authorize(userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(! Model.Competitor.exists({climber_id: this._id}));
        }
      },
    });
  };
});
