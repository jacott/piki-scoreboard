define((require)=>{
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const Role            = require('models/role');

  const FIELD_SPEC = {
    name: 'string',
    email: 'string',
    shortName: 'string',
  };

  return model =>{
    require(['models/change-log'], ChangeLog => {
      ChangeLog.logChanges(model);
    });

    util.merge(model.prototype, {
      authorize(userId) {
        Val.assertDocChanges(this, FIELD_SPEC);
        Val.allowAccessIf(Role.where({
          user_id: userId, role: Model.User.ROLE.superUser}).count(1));
      },
    });
  };
});
