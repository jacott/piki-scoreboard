define(() => (mig) => {
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
      async add(db) {
        for(const user of await db.query(`select * from "User"`)) {
          if (user.role === 'g') {
            if (user._id !== 'guest')
              await db.query(`delete from "User" where _id = $1`, [user._id]);
          } else {
            await db.query(
              `insert into "Role" (_id, org_id, user_id, role) values ($1, $2, $1, $3)`, [
                user._id, user.role === 's' ? null : user.org_id, user.role
              ]
            );
          }
        }
        await db.query('alter table "User" drop column org_id, drop column role');
      },
      revert(db) {throw new Error('revert not implemented')}
    });
});
