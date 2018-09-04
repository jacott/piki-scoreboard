define((require, exports, module)=>{
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');
  const Climber         = require('./climber');
  const Org             = require('./org');
  const Result          = require('./result');
  const User            = require('./user');

  const {stub, spy, onEnd} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let org, user;
    beforeEach(()=>{
      org = Factory.createOrg();
      user = Factory.createUser();
      stub(koru, 'info');
    });

    afterEach(()=>{
      TH.clearDB();
    });

    test("merge", ()=>{
      const rpc = TH.mockRpc();
      stub(Val, 'assertCheck');
      spy(Climber.prototype, 'authorize');

      TH.login();

      const c1 = Factory.createClimber();
      const c2 = Factory.createClimber();
      const comp21 = Factory.createCompetitor();
      const comp22 = Factory.createCompetitor();
      const result21 = Factory.createResult();

      const c3 = Factory.createClimber();
      const comp31 = Factory.createCompetitor();
      const result31 = Factory.createResult();

      const c4 = Factory.createClimber();
      const comp41 = Factory.createCompetitor();
      const result41 = Factory.createResult();

      const myConns = {
        a: {org_id: c1.org_id, sendBinary: stub()},
        b: {org_id: c1.org_id, sendBinary: stub()},
        c: {org_id: 'other', sendBinary: stub()},
      };

      TH.stubProperty(session, 'conns', {value: myConns});

      rpc("Climber.merge", c1._id, [c2._id, c3._id]);

      assert.calledWith(Val.assertCheck, c1._id, 'id');
      assert.calledWith(Val.assertCheck, [c2._id, c3._id], ['id']);

      assert.calledWith(Climber.prototype.authorize, TH.userId());
      assert.equals(Climber.prototype.authorize.firstCall.thisValue, TH.matchModel(c1));

      assert.same(Climber.query.count(), 2);

      assert.same(comp41.$reload(true).climber_id, c4._id);
      assert.same(comp22.$reload(true).climber_id, c1._id);
      assert.same(comp31.$reload(true).climber_id, c1._id);
      assert.same(comp21.$reload(true).climber_id, c1._id);

      assert.same(result21.$reload(true).climber_id, c1._id);
      assert.same(result31.$reload(true).climber_id, c1._id);
      assert.same(result41.$reload(true).climber_id, c4._id);

      assert.calledWith(myConns.a.sendBinary, 'B', ['mergeClimbers', c1._id, [c2._id, c3._id]]);
      assert.calledWith(myConns.b.sendBinary, 'B', ['mergeClimbers', c1._id, [c2._id, c3._id]]);
      refute.called(myConns.c.sendBinary);
    });

    group("clearAllNumbers", ()=>{
      beforeEach(()=>{
        org = Factory.createOrg();
      });

      test("non admin", ()=>{
        const rpc = TH.mockRpc();
        spy(Val, 'assertCheck');

        TH.loginAs(Factory.createUser('judge'));

        assert.exception(()=>{
          rpc("Climber.clearAllNumbers");
        }, {error: 403});

        assert.calledWith(Val.assertCheck, undefined, 'id');
      });

      test("success", ()=>{
        const rpc = TH.mockRpc();

        TH.loginAs(Factory.createUser('admin'));

        const c1 = Factory.createClimber({number: 123});
        const c2 = Factory.createClimber({number: 456});

        const org2 = Factory.createOrg();

        const c3 = Factory.createClimber({number: 123});

        rpc("Climber.clearAllNumbers", org._id);

        assert.same(c1.number, undefined);
        assert.same(c2.$reload(true).number, undefined);
        assert.same(c3.$reload(true).number, 123);
      });
    });

    group("authorize", ()=>{
      test("denied", ()=>{
        const oOrg = Factory.createOrg();
        const oUser = Factory.createUser();

        const climber = Factory.buildClimber();

        assert.accessDenied(()=>{climber.authorize(user._id)});
      });

      test("allowed", ()=>{
        const climber = Factory.buildClimber();

        refute.accessDenied(()=>{climber.authorize(user._id)});
      });

      test("okay to remove", ()=>{
        const climber = Factory.createClimber();

        refute.accessDenied(()=>{climber.authorize(user._id, {remove: true})});

      });

      test("remove in use", ()=>{
        const climber = Factory.createClimber();
        const competitor = Factory.createCompetitor();

        assert.accessDenied(()=>{climber.authorize(user._id, {remove: true})});
      });
    });
  });
});
