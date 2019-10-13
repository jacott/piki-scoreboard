define(()=> mig =>{
  mig.reversible({
    add(client) {
      client.query(`alter table "UserLogin" rename column srp to password`);
    },

    revert(client) {
      client.query(`alter table "UserLogin" rename column password to srp`);
    },
  });
});
