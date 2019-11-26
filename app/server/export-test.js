define((require, exports, module)=>{
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

  const {Writable}      = requirejs.nodeRequire('stream');

  const {stub, spy, util, intercept, stubProperty} = TH;

  const Export = require('./export');

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    let exportOrg;
    beforeEach(()=>{
      TH.startTransaction();
      exportOrg = WebServer.getHandler('export');
      stub(UserAccount, 'sendResetPasswordEmail');
    });

    afterEach(()=>{
      TH.rollbackTransaction();
    });

    test("export sql", async ()=>{
      let id = 1000;
      intercept(Random, 'id', () => 'id'+(++id));
      const org = Factory.createOrg();
      const user = Factory.createUser('admin');
      Factory.createResult();
      Factory.createResult();
      const org2 = Factory.createOrg();
      Factory.createResult();
      const future = new util.Future;
      Org.db.withConn(conn =>{future.return(conn)});
      const pg = future.wait();
      const {Libpq} = Driver;
      stub(Libpq, 'connect', url => Driver.config.url === url ? pg : void 0);
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
        url: `fdsf//dsfds/export/sql/foo=Bar.json?${org._id}&mySess|mySessAuth`,
        headers: {},
      };

      const p =  new Promise((resolve, reject)=>{
        res.end = resolve;
        res.on('error', reject);
      });

      const conn = {
        userId: user._id,
        sessAuth: 'mySess|mySessAuth',
      };
      stubProperty(Session.conns, 'mySess', {value: conn});

      exportOrg(req, res);

      assert.same(await p, void 0);

      assert.calledWith(res.writeHead, 200, {
        'Content-Type': 'application/sql',
        'Content-disposition': 'attachment; filename=fooBar.json.sql',
        'Transfer-Encoding': 'chunked'
      });

      assert.match(output, `CREATE TABLE public."Climber"`);
      assert.match(output, `COPY public."Climber" FROM stdin;
id1008	Climber 1	id1001	\\N	2000-01-01	m	1	\\N	\\N	{id1007}
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
