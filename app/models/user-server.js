define(function(require, exports, module) {
  var util = require('koru/util');
  var Val = require('koru/model/validation');


  return function (model) {
    var permitSpec = Val.permitSpec('name', 'email', 'initials', 'org_id', 'role');

    model.registerObserveField('org_id');

    util.extend(model, {
      guestUser: function () {
        return model.findById('guest') || (
          model.docs.insert({_id: 'guest', role: 'g'}),
          model.findById('guest'));
      },
    });

    util.extend(model.prototype, {
      authorize: function (userId) {
        var role = model.ROLE;

        Val.permitDoc(this, permitSpec);

        var authUser = model.query.where({
          _id: userId,
          role: {$in: [role.superUser, role.admin]},
        }).fetchOne();

        Val.allowAccessIf(authUser);

        Val.allowAccessIf(this.$isNewRecord() || authUser.isSuperUser() || this.attributes.role !== role.superUser);
      },
    });

  };
});
