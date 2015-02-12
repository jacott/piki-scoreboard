define(function(require, exports, module) {
  var util = require('koru/util');
  var User = require('./user');
  var Val = require('koru/model/validation');

  return function (model) {
    model.registerObserveField('org_id');

    util.extend(model.prototype, {
      authorize: function (userId) {
        User.fetchAdminister(userId, this);
      },
    });
  };
});
