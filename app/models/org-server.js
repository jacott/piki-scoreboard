define(function(require, exports, module) {
  var util = require('koru/util');
  var Val = require('koru/model/validation');
  var Model = require('koru/model');

  return function(model){
    // FIXME ChangeLog.logChanges(model);

    util.extend(model.prototype, {
      authorize: function (userId) {
        Val.allowAccessIf(Model.User.query.where({_id: userId, role: Model.User.ROLE.superUser}).count(1));
      },
    });
  };
});
