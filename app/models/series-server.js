define(function(require, exports, module) {
  const match = require('koru/match');
  const Val   = require('koru/model/validation');
  const util  = require('koru/util');
  const User  = require('models/user');

  const FIELD_SPEC = {
    name: 'string',
    org_id: 'id',
    teamType_ids: ['id'],
    date: 'string',
    closed: match.or(match.boolean, match.string, match.nil),
  };

  return function (Series) {
    Series.registerObserveField('org_id');
    util.extend(Series.prototype, {
      authorize(userId) {
        User.fetchAdminister(userId, this);

        const changes = this.changes;

        Val.assertDocChanges(this, FIELD_SPEC);

        if (changes.hasOwnProperty('closed'))
          Val.allowAccessIf(Object.keys(changes).length === 1);
        else
          Val.allowAccessIf(! this.closed &&
                            (this.$isNewRecord() || ! changes.hasOwnProperty('org_id')));

      },
    });
  };
});
