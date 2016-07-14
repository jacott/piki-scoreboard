define(function(require, exports, module) {
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  return function (Team) {
    ChangeLog.logChanges(Team);

    Team.registerObserveField('org_id');

    util.extend(Team.prototype, {
      authorize: function (userId) {
        User.fetchAdminister(userId, this);
      },
    });
  };
});
