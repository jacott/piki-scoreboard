define(function(require, exports, module) {
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const ChangeLog = require('./change-log');
  const Event     = require('./event');
  const User      = require('./user');

  return model =>{
    ChangeLog.logChanges(model);

    var FIELD_SPEC = {
      category_ids: ['id'],
      team_ids: ['id'],
      number: 'integer',
    };

    var NEW_FIELD_SPEC = {
      _id: 'id',
      event_id: 'id',
      climber_id: 'id',
    };

    util.extend(model.prototype, {
      authorize(userId) {
        Val.ensureString(this.event_id);

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        var event = Event.findById(this.attributes.event_id || this.event_id);

        Val.allowAccessIf(! event.closed);

        User.fetchAdminister(userId, event);
      },
    });
  };
});
