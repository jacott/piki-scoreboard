define(function(require, exports, module) {
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  return function (model) {
    ChangeLog.logChanges(model);

    model.registerObserveField('org_id');

    util.extend(model.prototype, {
      authorize: function (userId) {
        User.fetchAdminister(userId, this);
      },
    });
  };
});
