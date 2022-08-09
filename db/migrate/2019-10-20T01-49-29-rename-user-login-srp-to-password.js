define(()=> mig =>{
  mig.reversible({
    add(client) {
      return client.query(`alter table "UserLogin" rename column srp to password`);
    },

    revert(client) {
      return client.query(`alter table "UserLogin" rename column password to srp`);
    },
  });
});
