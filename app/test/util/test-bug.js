define((require, exports, module) => {
  'use strict';
  const koru            = require('koru');
  const Driver          = require('koru/pg/driver');

  return function (args) {
    // if (args[0] !== void 0 && args[0] !== 'execute') {
    //   this.usage('[execute]');
    // }

    const streamEnd = (stream) => new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    const orgId = 'NA2ohp6ysBKzfmig5';

    const copyToStream = (pg, name, orgId, columns='*', format='') => {
      const where = `org_id = '${orgId}'`;
      return pg.conn.copyToStream(
        `COPY (select ${columns} from "${name}" as t where ${where}) TO STDOUT ` + format);
    };

    const connectDb = () => Driver.connect(Driver.config.url, 'piki-export-test');

    const run = async () => {
      const db = connectDb();
      const pg = await db._getConn();

      const res = process.stdout;

      const writeData = async (name, columns='*') => {
        res.write(`COPY public."${name}" FROM stdin;\n`);
        const stream = copyToStream(pg, name, orgId, columns);
        const e = streamEnd(stream);
        // stream.on('data', (b) => {res.write(b)});
        stream.pipe(res, {end: false});

        // await new Promise((resolve, reject) => {
        //   setTimeout(resolve, 3000);
        // });
        await e;
        res.write('\\.\n\n');
      };

      await writeData('Category');
      await writeData('Climber');

      process.exit(0);
    };

    return run();
  }
});
