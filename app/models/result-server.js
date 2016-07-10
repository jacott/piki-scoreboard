define(function(require, exports, module) {
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const Event     = require('models/event');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  return function (Result) {
    ChangeLog.logChanges(Result, {parent: Event});

    util.extend(Result.prototype, {
      authorize(userId) {
        User.fetchAdminister(userId, this);
        Val.allowAccessIf(! this.event.closed);
      },
    });

  };
});
