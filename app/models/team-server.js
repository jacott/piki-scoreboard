define((require) => {
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const ChangeLog       = require('./change-log');
  const User            = require('./user');

  const FIELD_SPEC = {
    name: 'string',
    shortName: 'string',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    org_id: 'id',
    teamType_id: 'id',
  };

  return (Team) => {
    ChangeLog.logChanges(Team);

    Team.registerObserveField('org_id');

    util.merge(Team.prototype, {
      async authorize(userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        await User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(! await Model.Competitor.exists({team_ids: this._id}));
        }
      },
    });
  };
});
