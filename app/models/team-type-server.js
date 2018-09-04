define((require)=>{
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  const FIELD_SPEC = {
    name: 'string',
    default: 'boolean',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    org_id: 'id',
  };

  return TeamType =>{
    ChangeLog.logChanges(TeamType);

    TeamType.registerObserveField('org_id');

    util.merge(TeamType.prototype, {
      authorize(userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(TeamType.db.query(`
select 1 where
exists(select 1 from "Team" where "teamType_id" = $1) or
exists(select 1 from "Series" where $1 = ANY("teamType_ids")) or
exists(select 1 from "Event" where $1 = ANY("teamType_ids"))
`, [this._id]).length === 0);
        }
      },
    });
  };
});
