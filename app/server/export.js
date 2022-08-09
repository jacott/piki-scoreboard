const archiver = require('archiver');

define((require, exports, module) => {
  'use strict';
  const koru            = require('koru');
  const ModelMap        = require('koru/model/map');
  const Driver          = require('koru/pg/driver');
  const sUtil           = require('koru/server-util');
  const Session         = require('koru/session');
  const WebServer       = require('koru/web-server');
  const {spawn}         = requirejs.nodeRequire('child_process');
  const fs              = requirejs.nodeRequire('fs');
  const Role            = require('models/role');
  const User            = require('models/user');

  const path = requirejs.nodeRequire('path');
  const {Readable} = requirejs.nodeRequire('stream');

  const {env} = process;

  const userFromAuth = (auth) => {
    const [sessId] = auth.split('|', 1);
    const conn = Session.conns[sessId];
    return conn && conn.sessAuth === auth ? User.findById(conn.userId) : undefined;
  };

  const EXCLUDE = ['UserLogin', 'ChangeLog'];

  const whereEvent = (orgId) => `EXISTS(select 1 from "Event" as e
where org_id = '${orgId}' and t.event_id = e._id)`;

  const WHERE_FUNCS = {
    Migration: () => 'true',
    Competitor: whereEvent,
    Result: whereEvent,
    ClimberRanking: whereEvent,
    Org: (orgId) => `_id = '${orgId}'`,
    User: (orgId) => `EXISTS(select 1 from "Role" as r
where r.org_id = '${orgId}' and r.user_id = t._id)`,
    UserLogin: (orgId) => `EXISTS(select 1 from "Role" as r
where r.org_id = '${orgId}' and r.user_id = t."userId")`,
  };

  const santitizeFilename = (fn, suffix) => {
    fn = fn.replace(/[^a-z0-9_.-]/ig, '');
    if (! fn.toLowerCase().endsWith(suffix)) {
      fn += suffix;
    }

    return fn;
  };

  const getTables = (pg) => pg.exec(`
SELECT table_name as name FROM information_schema.tables
 WHERE table_schema='public' AND table_type='BASE TABLE' AND NOT (table_name = ANY($1));`, [EXCLUDE]);

  const writeHead = (res, type, filename) => {
    res.writeHead(200, {
      'Content-Type': type,
      'Content-disposition': 'attachment; filename=' + filename,
      'Transfer-Encoding': 'chunked',
    });
  };

  const streamEnd = (stream) => new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  const copyToStream = (pg, name, orgId, columns='*', format='') => {
    const whereFunc = WHERE_FUNCS[name];
    const where = whereFunc ? whereFunc(orgId) : `org_id = '${orgId}'`;
    return pg.conn.copyToStream(
      `COPY (select ${columns} from "${name}" as t where ${where}) TO STDOUT ` + format);
  };

  const connectDb = () => Driver.connect(Driver.config.url, 'piki-export');

  const EXPORTERS = {
    sql: (res, orgId, filename) => {
      const writeTables = async () => {
        const db = connectDb();
        const pg = await db._getConn();
        try {
          const writeSql = (name) => {
            res.write(`COPY public."${name}" FROM stdin;\n`);
          };

          const writeData = async (name, columns='*') => {
            const stream = copyToStream(pg, name, orgId, columns);
            stream.pipe(res, {end: false});
            await streamEnd(stream);
            res.write('\\.\n\n');
          };

          for (const {name} of await getTables(pg)) {
            writeSql(name);
            await writeData(name);
          }

          res.write(`COPY public."UserLogin" (_id , "userId" , email) FROM stdin;\n`);
          await writeData('UserLogin', '_id, "userId", email');

          res.write(`\nINSERT INTO public."User" (_id) values ('guest');\n`);

          res.end();
        } catch (err) {
          koru.unhandledException(err);
          res.destroy(err);
        } finally {
          db._releaseConn();
          db.end();
        }
      };

      writeHead(res, 'application/sql', santitizeFilename(filename, '.sql'));

      const schema = fs.createReadStream(path.join(koru.appDir, '../db/schema.sql'));

      schema.pipe(res, {end: false});

      schema.on('end', writeTables);
    },

    csv: (res, orgId, filename) => {
      const writeTables = async (archive) => {
        const db = connectDb();
        const pg = await db._getConn();
        try {
          const writeData = async (name) => {
            const stream = copyToStream(pg, name, orgId, undefined, '(FORMAT csv, header)');
            archive.append(stream, {name: name + '.csv'});

            await streamEnd(stream);
          };

          for (const {name} of await getTables(pg)) {
            await writeData(name);
          }

          archive.finalize();
        } catch (err) {
          koru.unhandledException(err);
          res.destroy(err);
        } finally {
          db._releaseConn();
          db.end();
        }
      };

      writeHead(res, 'application/zip', santitizeFilename(filename, '.zip'));

      const archive = archiver('zip', {zlib: {level: 9}});
      archive.on('error', (err) => {res.destroy(err)});
      archive.pipe(res);

      writeTables(archive);
    },
  };

  WebServer.registerHandler(module, 'export', async (req, res) => {
    const [path, search] = req.url.replace(/^.*export\//, '').split('?');
    const [type, filename] = path.split('/');
    const [orgId, auth] = search.split('&');
    const user = await userFromAuth(auth);
    const role = user === undefined ? undefined : await Role.readRole(user._id, orgId);

    const exporter = EXPORTERS[type];

    if (exporter === undefined || role === undefined || ! /[sa]/.test(role.role)) {
      res.writeHead(403);
      res.end('Access denied');
      return;
    }

    exporter(res, orgId, filename);
  });
});
