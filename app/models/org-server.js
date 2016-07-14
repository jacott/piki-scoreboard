define(function(require, exports, module) {
  var util = require('koru/util');
  var Val = require('koru/model/validation');
  var Model = require('koru/model');

  const FIELD_SPEC = {
    name: 'string',
    email: 'string',
    shortName: 'string',
  };

  return function(model){
    // FIXME ChangeLog.logChanges(model);

    util.extend(model.prototype, {
      authorize: function (userId) {
        Val.assertDocChanges(this, FIELD_SPEC);
        Val.allowAccessIf(Model.User.query.where({_id: userId, role: Model.User.ROLE.superUser}).count(1));
      },
    });
  };
});
