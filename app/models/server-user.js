define(function(require, exports, module) {
  var util = require('koru/util');

  return function (model) {

    model.registerObserveField('org_id');

    util.extend(model, {
      guestUser: function () {
        return model.findById('guest') || (
          model.docs.insert({_id: 'guest', role: 'g'}),
          model.findById('guest'));
      },
    });
  };
});
