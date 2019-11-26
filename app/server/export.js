
define((require, exports, module)=>{
  'use strict';
  const koru            = require('koru');
  const ModelMap        = require('koru/model/map');
  const Driver          = require('koru/pg/driver');
  const sUtil           = require('koru/server-util');
  const Session         = require('koru/session');
  const WebServer       = require('koru/web-server');
  const Role            = require('models/role');
  const User            = require('models/user');
  const {spawn}         = requirejs.nodeRequire('child_process');
  const fs              = requirejs.nodeRequire('fs');
  const path            = requirejs.nodeRequire('path');
  const {Readable}      = requirejs.nodeRequire('stream');

  const {env} = process;

  const userFromAuth = auth =>{
    const [sessId] = auth.split('|', 1);
    const conn = Session.conns[sessId];
    return conn && conn.sessAuth === auth ? User.findById(conn.userId) : void 0;
  };

  const EXCLUDE = {UserLogin: true, ChangeLog: true};

  const whereEvent = orgId => `EXISTS(select 1 from "Event" as e
where org_id = '${orgId}' and t.event_id = e._id)`;

  const WHERE_FUNCS = {
    Migration: ()=>'true',
    Competitor: whereEvent,
    Result: whereEvent,
    Org: orgId =>`_id = '${orgId}'`,
    User: orgId => `EXISTS(select 1 from "Role" as r
where r.org_id = '${orgId}' and r.user_id = t._id)`
  };

  const santitizeFilename = (fn, suffix)=>{
    fn = fn.replace(/[^a-z0-9_.]/ig, '');
    if (! fn.toLowerCase().endsWith(suffix))
      fn += suffix;

    return fn;
  };

  const EXPORTERS = {
    sql: (res, orgId, filename)=>{
      const writeTables = async ()=>{
        try {
          const pg = await Driver.Libpq.connect(Driver.config.url);
          const tables = await pg.exec(`
SELECT table_name as name
  FROM information_schema.tables
 WHERE table_schema='public'
   AND table_type='BASE TABLE';
`);

          const writeSql = (name)=>{
            res.write(`COPY public."${name}" FROM stdin;\n`);
          };

          const writeData = async (sql)=>{
            const stream = pg.copyToStream(sql);
            stream.pipe(res, {end: false});
            await new Promise((resolve, reject)=>{
              stream.on('end', resolve);
              stream.on('error', reject);
            });
            res.write("\\.\n\n");
          };

          for (const {name} of tables) {
            if (EXCLUDE[name]) continue;
            writeSql(name);
            const whereFunc = WHERE_FUNCS[name];
            let where = whereFunc ? whereFunc(orgId) : `org_id = '${orgId}'`;
            await writeData(`COPY (select * from "${name}" as t where ${where}) TO STDOUT`);
          }

          res.write(`COPY public."UserLogin" (_id , "userId" , email) FROM stdin;\n`);
          await writeData(`COPY (select _id , "userId" , email from "UserLogin" as t
where EXISTS(select 1 from "Role" as r
where r.org_id = '${orgId}' and r.user_id = t."userId")) TO STDOUT`);

          res.write(`\nINSERT INTO public."User" (_id) values ('guest');\n`);

          res.end();

        } catch(err) {
          koru.unhandledException(err);
          res.destroy(err);
        }
      };

      res.writeHead(200, {
        'Content-Type': 'application/sql',
        'Content-disposition': 'attachment; filename='+santitizeFilename(filename, '.sql'),
        'Transfer-Encoding': 'chunked'
      });

      const schema = fs.createReadStream(path.join(koru.appDir, '../db/schema.sql'));

      schema.pipe(res, {end: false});

      schema.on('end', writeTables);
    },
  };

  WebServer.registerHandler(module, 'export', (req, res)=>{
    const [type, last] = req.url.replace(/^.*export\//, '').split('/');
    const [filename, search] = last.split('?');
    const [orgId, auth] = search.split('&');
    const user = userFromAuth(auth);
    const role = user && Role.readRole(user._id, orgId);

    const exporter = EXPORTERS[type];

    if (exporter === void 0 || role === void 0 || ! /[sa]/.test(role.role)) {
      res.writeHead(403);
      res.end("Access denied");
      return;
    }

    exporter(res, orgId, filename);
  });
});
