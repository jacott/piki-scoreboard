define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var Model = require('model');

  var permitSpec = Val.permitSpec('name', 'org_id', 'club_id', 'dateOfBirth', 'gender', 'number', 'disabled');

  return function (model) {
    ChangeLog.logChanges(model);

    model.registerObserveField('org_id');

    util.extend(model.prototype, {
      authorize: function (userId, options) {
        Val.permitDoc(this, permitSpec);
        User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(! Model.Result.exists({climber_id: this._id}));
        }
      },
    });
  };
});
