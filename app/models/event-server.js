define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var match = require('koru/match');

  var FIELD_SPEC = {
    name: 'string',
    org_id: 'id',
    teamType_ids: ['id'],
    date: 'string',
    closed: match.or(match.boolean, match.string, match.nil),
    heats: 'baseObject',
  };

  return function (model) {
    ChangeLog.logChanges(model);

    model.registerObserveField('org_id');

    util.extend(model.prototype, {
      authorize: function (userId) {
        User.fetchAdminister(userId, this);

        var changes = this.changes;

        Val.assertDocChanges(this, FIELD_SPEC);

        if (changes.hasOwnProperty('closed'))
          Val.allowAccessIf(Object.keys(changes).length === 1);
        else
          Val.allowAccessIf(! this.closed &&
                            (this.$isNewRecord() || ! changes.hasOwnProperty('org_id')));

      },
    });

  };

});
