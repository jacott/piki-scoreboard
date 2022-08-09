const unzipper = require('unzipper');

define((require, exports, module) => {
  'use strict';
  const TH              = require('koru/model/test-db-helper');
  const Driver          = require('koru/pg/driver');
  const Random          = require('koru/random');
  const Session         = require('koru/session');
  const UserAccount     = require('koru/user-account');
  const WebServer       = require('koru/web-server');
  const Category        = require('models/category');
  const Org             = require('models/org');
  const Result          = require('models/result');
  const Factory         = require('test/factory');

  const {Writable, Transform} = requirejs.nodeRequire('stream');

  const {stub, spy, util, intercept, stubProperty} = TH;

  const Export = require('./export');

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test}) => {
    let exportOrg;
    beforeEach(async () => {
      await TH.startTransaction();
      exportOrg = WebServer.getHandler('export');
      stub(UserAccount, 'sendResetPasswordEmail');
    });

    afterEach(() => TH.rollbackTransaction());

    test('export csv', async () => {
      let id = 1000;
      intercept(Random, 'id', () => 'id' + (++id));
      const org = await Factory.createOrg();
      const user = await Factory.createUser('admin');
      await Factory.createResult();
      await Factory.createResult();
      const org2 = await Factory.createOrg();
      await Factory.createResult();
      stub(Driver, 'connect', (url) => Driver.config.url === url ? Org.db : undefined);
      let ended = false;
      let output = '';

      const res = new Transform({
        transform(data, encoding, callback) {
          this.push(data);
          callback();
        },
      });

      res.writeHead = stub();

      const req = {
        url: `fdsf//dsfds/export/csv/output-csv.zip?${org._id}&mySess|mySessAuth/+abc`,
        headers: {},
      };

      const conn = {
        userId: user._id,
        sessAuth: 'mySess|mySessAuth/+abc',
      };
      stubProperty(Session.conns, 'mySess', {value: conn});

      const tables = {};

      const zip = new unzipper.Parse();

      res
        .pipe(zip)
        .on('entry', (entry) => {
          const name = entry.path;
          tables[name] = '';
          const wr = new Writable({
            write(data, encoding, callback) {
              tables[name] += data;
              callback();
            },
            autoDestroy: true,
          });
          entry.pipe(wr);
        });

      exportOrg(req, res);

      await new Promise((resolve, reject) => {
        zip.on('finish', resolve);
        res.on('error', reject);
        zip.on('error', reject);
      });

      assert.calledWith(res.writeHead, 200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=output-csv.zip',
        'Transfer-Encoding': 'chunked',
      });
      assert.equals(
        tables['Org.csv'],
        '_id,name,email,shortName\n' +
          'id1001,Org 1,email1@vimaly.com,SN1\n');
      assert.equals(
        tables['Event.csv'],
        '_id,name,org_id,heats,date,errors,closed,teamType_ids,series_id,ruleVersion\n' +
          'id1007,Event 1,id1001,"{""id1006"": ""LQQF8""}",2014-04-01,,,{id1005},,1\n');
    });

    test('export sql', async () => {
      let id = 1000;
      intercept(Random, 'id', () => 'id' + (++id));
      const org = await Factory.createOrg();
      const user = await Factory.createUser('admin');
      await Factory.createResult();
      await Factory.createResult();
      const org2 = await Factory.createOrg();
      await Factory.createResult();
      stub(Driver, 'connect', (url) => Driver.config.url === url ? Org.db : undefined);
      let ended = false;
      let output = '';
      const res = new Writable({
        write(data, encoding, callback) {
          output += data;
          callback();
        },
        autoDestroy: true,
      });

      res.writeHead = stub();

      const req = {
        url: `fdsf//dsfds/export/sql/foo=Bar.json?${org._id}&mySess|mySessAuth/+abc`,
        headers: {},
      };

      const p = new Promise((resolve, reject) => {
        res.end = resolve;
        res.on('error', reject);
      });

      const conn = {
        userId: user._id,
        sessAuth: 'mySess|mySessAuth/+abc',
      };
      stubProperty(Session.conns, 'mySess', {value: conn});

      exportOrg(req, res);

      assert.same(await p, undefined);

      assert.calledWith(res.writeHead, 200, {
        'Content-Type': 'application/sql',
        'Content-disposition': 'attachment; filename=fooBar.json.sql',
        'Transfer-Encoding': 'chunked',
      });

      assert.match(output, `CREATE TABLE public."Climber"`);
      assert.match(output, `COPY public."Climber" FROM stdin;
id1008	Climber 1	id1001	\\N	2000-01-01	m	1	\\N	\\N	{id1009}
\\.
`);

      assert.match(output, `
COPY public."UserLogin" (_id , "userId" , email) FROM stdin;
id1004	id1002	email-user.1@test.co
\\.
`);

      refute.match(output, org2._id);
    });
  });
});
