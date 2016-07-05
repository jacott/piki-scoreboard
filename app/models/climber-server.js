define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var Model = require('model');

  var FIELD_SPEC = {
    name: 'string',
    org_id: 'string',
    dateOfBirth: 'string',
    gender: 'string',
    number: 'number',
    disabled: 'boolean',
  };

  return function (model) {
    ChangeLog.logChanges(model);

    model.registerObserveField('org_id');

    util.extend(model.prototype, {
      authorize: function (userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC);
        User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(! Model.Result.exists({climber_id: this._id}));
        }
      },
    });
  };
});
