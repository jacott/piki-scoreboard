define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var Event = require('./event');

  return function (model) {
    ChangeLog.logChanges(model);

    var changeSpec = Val.permitSpec('category_ids');

    util.extend(model.prototype, {
      authorize: function (userId) {
        Val.ensureString(this.event_id);

        if (! this.$isNewRecord())
          Val.permitParams(this.changes, changeSpec);

        var event = Event.findById(this.attributes.event_id || this.event_id);

        Val.allowAccessIf(! event.closed);

        User.fetchAdminister(userId, event);
      },
    });
  };
});
