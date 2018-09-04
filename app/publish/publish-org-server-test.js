define((require, exports, module)=>{
  const koru            = require('koru');
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const publish         = require('koru/session/publish');
  const Role            = require('models/role');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  const sut             = require('./publish-org-server');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v.org = Factory.createOrg();
      v.user = Factory.createUser();
      TH.loginAs(v.user);
      stub(Val, 'ensureString');
    });

    afterEach(()=>{
      TH.cleanUpTest(v);
      v = {};
    });

    test("publish", ()=>{
      const org1 = Factory.createOrg({shortName: 'foo'});
      const org_id = org1._id;

      const user1 = Factory.createUser();
      const user2 = Factory.createUser();

      const tt1 = Factory.createTeamType();
      const team1 = Factory.createTeam();

      const obSpys = 'Climber Event Series Category Team TeamType'.split(' ').map(name=>{
        try {
          return spy(Model[name], 'observeOrg_id');
        } catch(ex) {
          ex.message += ". Failed for: " + name;
          throw ex;
        }
      });

      // Subscribe
      const sub = TH.mockSubscribe(v, 's123', 'Org', 'foo');

      assert.equals(sub.conn.org_id, org1._id);


      assert.calledWith(Val.ensureString, 'foo');

      // Test initial data
      assert.calledWith(v.conn.added, 'User', user1._id, Object.assign({
        role: 'a', org_id}, user1.attributes));
      assert.calledWith(v.conn.added, 'User', user2._id, Object.assign({
        role: 'a', org_id}, user2.attributes));


      assert.calledWith(v.conn.added, 'Team', team1._id, team1.attributes);
      assert.calledWith(v.conn.added, 'TeamType', tt1._id, tt1.attributes);

      // Test changes
      user1.name = 'new name';
      user1.$$save();

      assert.calledWith(v.conn.changed, 'User', user1._id, {name: 'new name'});

      const role1 = Role.readRole(user1._id, org_id);
      role1.$update('role', 'j');

      assert.calledWith(v.conn.changed, 'User', user1._id, {role: 'j'});


      team1.name = 'new team name';
      team1.$$save();

      assert.calledWith(v.conn.changed, 'Team', team1._id, {name: 'new team name'});

      // *** test stopping ***

      const stopSpys = obSpys.map(ob=>{
        assert.calledWith(ob, [org1._id]);
        return spy(ob.firstCall.returnValue, 'stop');
      });

      sub.stop();

      stopSpys.forEach(spy=>{assert.called(spy)});
    });

    test("org not found", ()=>{
      var sub = TH.mockSubscribe(v, 's123', 'Org', 'bad');

      refute(sub);

      assert.calledWith(v.conn.sendBinary, 'P', ['s123', 404, 'Org not found']);
    });
  });
});
