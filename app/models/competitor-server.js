define((require) => {
  'use strict';
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const ChangeLog       = require('./change-log');
  const Event           = require('./event');
  const User            = require('./user');

  return (Competitor) => {
    ChangeLog.logChanges(Competitor);

    const FIELD_SPEC = {
      category_ids: ['id'],
      team_ids: ['id'],
      number: 'integer',
    };

    const NEW_FIELD_SPEC = {
      _id: 'id',
      event_id: 'id',
      climber_id: 'id',
    };

    util.merge(Competitor.prototype, {
      async authorize(userId) {
        Val.ensureString(this.event_id);

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        const event = await Event.findById(this.attributes.event_id ?? this.event_id);

        Val.allowAccessIf(! event.closed);

        await User.fetchAdminister(userId, event);
      },
    });
  };
});
