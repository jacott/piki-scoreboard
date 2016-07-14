define(function(require) {
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const Model     = require('model');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  const FIELD_SPEC = {
    name: 'string',
    dateOfBirth: 'string',
    gender: 'string',
    number: 'number',
    disabled: 'boolean',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    org_id: 'id',
  };

  return function (Climber) {
    ChangeLog.logChanges(Climber);

    Climber.registerObserveField('org_id');

    util.extend(Climber.prototype, {
      authorize(userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(! Model.Competitor.exists({climber_id: this._id}));
        }
      },
    });
  };
});
