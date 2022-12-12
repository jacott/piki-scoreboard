define((require, exports, module) => {
  'use strict';
  const match           = require('koru/match');
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const ChangeLog       = require('./change-log');
  const User            = require('./user');
  const Category        = require('models/category');

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

  return (Event) => {
    ChangeLog.logChanges(Event);

    Event.registerObserveField('org_id');

    util.merge(Event.prototype, {
      async authorize(userId) {
        const user = await User.fetchAdminister(userId, this);

        const {changes} = this;

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        if (! changes.hasOwnProperty('closed')) {
          Val.allowAccessIf(! this.closed);
        }

        this.changes.series_id !== undefined &&
          Val.allowAccessIf(await this.series && await user.canAdminister(this.series));
      },

      async validate() {
        const heats = this.changes.heats;
        if (heats != null) for (const id in heats) {
          const cat = await Category.findById(id);
          Val.allowAccessIf(cat.org_id === this.org_id);
          const format = heats[id];
          if (format[0] !== cat.type || ! cat.heatFormatRegex.test(format.slice(1))) {
            return Val.addError(this, 'heats', 'is_invalid');
          }
        }
      },
    });
  };
});
