define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');

  var permitSpec = Val.permitSpec('name', 'org_id', 'date', 'closed', {heats: '*'});

  return function (model) {
    ChangeLog.logChanges(model);

    model.registerObserveField('org_id');

    util.extend(model.prototype, {
      authorize: function (userId) {
        User.fetchAdminister(userId, this);

        var changes = this.changes;

        Val.permitParams(changes, permitSpec, this.$isNewRecord());

        if (changes.hasOwnProperty('closed'))
          Val.allowAccessIf(Object.keys(changes).length === 1);
        else
          Val.allowAccessIf(! this.closed &&
                            (this.$isNewRecord() || ! changes.hasOwnProperty('org_id')));

      },
    });

  };

});
