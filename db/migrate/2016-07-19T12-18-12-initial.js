const fs =require('fs');

define((require, exports, module) => (mig) => {
  mig.reversible({
    async add(client) {
      if ((await client.query('SELECT 1 from "Migration" limit 1')).length) {
        return client.query('DELETE from "Migration"');
      }
      return client.query(fs.readFileSync(module.id.replace(/\/[^/]*$/, '/initial.sql')));
    },
    revert(client) {
      throw new Error('Initial migration can not be reverted');
    }
  });
});
