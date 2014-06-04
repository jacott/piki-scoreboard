define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var Event = require('./event');

  return function (model) {
    ChangeLog.logChanges(model);

    util.extend(model.prototype, {
      authorize: function (userId) {
        var user = User.findById(userId);

        Val.ensureString(this.event_id);
        var event = Event.findById(this.attributes.event_id || this.event_id);
        Val.allowAccessIf(user && event && user.org_id === event.org_id || user.role.indexOf(User.ROLE.superUser) >= 0);
      },
    });
  };
});
