define(function(require, exports, module) {

  module.exports = mig =>{
    mig.createTable({
      name: 'Role',
      fields: {
        org_id: {type: "id"},
        user_id: {type: "id"},
        role: {type: "text"}
      },
      indexes: [{columns: ['user_id', 'org_id'], unique: true}]
    });

    mig.reversible({
      add(db) {
        db.query(`select * from "User"`).forEach(user => {
          if (user.role === 'g') {
            if (user._id !== 'guest')
              db.query(`delete from "User" where _id = $1`, [user._id]);
          } else {
            db.query(
              `insert into "Role" (_id, org_id, user_id, role) values ($1, $2, $1, $3)`, [
                user._id, user.role === 's' ? null : user.org_id, user.role
              ]
            );
          }
        });
        db.query('alter table "User" drop column org_id, drop column role');
      },
      revert(db) {throw new Error('revert not implemented')}
    });
  };
});
