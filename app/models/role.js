define((require, exports, module)=>{
  const Model           = require('model');

  class Role extends Model.BaseModel {
    static readRole(user_id, org_id) {
      return Role.query.whereSql(
        `user_id = {$user_id} and (org_id is null or org_id = {$org_id})`, {user_id, org_id}
      ).fetchOne() || new Role({_id: '$unknown', role: 'g', org_id, user_id});
    }
  }

  Role.define({
    module,
    fields: {
      org_id: {type: '_id'},
      user_id: {type: "_id"},
      role: {type: 'text'},
    },
  });

  Role.registerObserveField('org_id');

  return Role;
});
