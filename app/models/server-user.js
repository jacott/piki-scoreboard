define(function(require, exports, module) {
  var model = require('./user');
  var util = require('koru/util');

  model.registerObserveField('org_id');

  util.extend(model, {
    guestUser: function () {
      return model.findById('guest') || (
        model.docs.insert({_id: 'guest', role: 'g'}),
        model.findById('guest'));
    },
  });

  return model;
});
