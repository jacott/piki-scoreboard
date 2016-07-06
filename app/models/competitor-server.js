define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var Event = require('./event');

  return function (model) {
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
      authorize: function (userId) {
        Val.ensureString(this.event_id);

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        var event = Event.findById(this.attributes.event_id || this.event_id);

        Val.allowAccessIf(! event.closed);

        User.fetchAdminister(userId, event);
      },
    });
  };
});
