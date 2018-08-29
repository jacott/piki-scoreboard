define(function(require, exports, module) {
  const match     = require('koru/match');
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  const FIELD_SPEC = {
    name: 'string',
    ruleVersion: 'number',
    teamType_ids: ['id'],
    date: 'string',
    closed: match.or(match.boolean, match.string, match.nil),
    heats: 'baseObject',
    series_id: 'id',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    org_id: 'id',
  };

  return function (Event) {
    ChangeLog.logChanges(Event);

    Event.registerObserveField('org_id');

    util.merge(Event.prototype, {
      authorize(userId) {
        const user = User.fetchAdminister(userId, this);

        var changes = this.changes;

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        if (! changes.hasOwnProperty('closed'))
          Val.allowAccessIf(! this.closed);

        this.changes.series_id && Val.allowAccessIf(this.series && user.canAdminister(this.series));
      },
    });

  };

});
