define((require, exports, module) => {
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const Climber         = require('./climber');
  const Org             = require('./org');
  const Result          = require('./result');
  const User            = require('./user');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, user;
    beforeEach(async () => {
      await TH.startTransaction();
      org = await Factory.createOrg();
      user = await Factory.createUser();
      TH.noInfo();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    test('merge', async () => {
      const rpc = TH.mockRpc();
      stub(Val, 'assertCheck');
      spy(Climber.prototype, 'authorize');

      await TH.login();

      const c1 = await Factory.createClimber();
      const c2 = await Factory.createClimber();
      const comp21 = await Factory.createCompetitor();
      const comp22 = await Factory.createCompetitor();
      const result21 = await Factory.createResult();

      const c3 = await Factory.createClimber();
      const comp31 = await Factory.createCompetitor();
      const result31 = await Factory.createResult();

      const c4 = await Factory.createClimber();
      const comp41 = await Factory.createCompetitor();
      const result41 = await Factory.createResult();

      const myConns = {
        a: {org_id: c1.org_id, sendBinary: stub()},
        b: {org_id: c1.org_id, sendBinary: stub()},
        c: {org_id: 'other', sendBinary: stub()},
      };

      TH.stubProperty(session, 'conns', {value: myConns});

      await rpc('Climber.merge', c1._id, [c2._id, c3._id]);

      assert.calledWith(Val.assertCheck, c1._id, 'id');
      assert.calledWith(Val.assertCheck, [c2._id, c3._id], ['id']);

      assert.calledWith(Climber.prototype.authorize, TH.userId());
      assert.equals(Climber.prototype.authorize.firstCall.thisValue, TH.matchModel(c1));

      assert.same(await Climber.query.count(), 2);

      assert.same((await comp41.$reload(true)).climber_id, c4._id);
      assert.same((await comp22.$reload(true)).climber_id, c1._id);
      assert.same((await comp31.$reload(true)).climber_id, c1._id);
      assert.same((await comp21.$reload(true)).climber_id, c1._id);

      assert.same((await result21.$reload(true)).climber_id, c1._id);
      assert.same((await result31.$reload(true)).climber_id, c1._id);
      assert.same((await result41.$reload(true)).climber_id, c4._id);

      assert.calledWith(myConns.a.sendBinary, 'B', ['mergeClimbers', c1._id, [c2._id, c3._id]]);
      assert.calledWith(myConns.b.sendBinary, 'B', ['mergeClimbers', c1._id, [c2._id, c3._id]]);
      refute.called(myConns.c.sendBinary);
    });

    group('clearAllNumbers', () => {
      beforeEach(async () => {
        org = await Factory.createOrg();
      });

      test('non admin', async () => {
        const rpc = TH.mockRpc();
        spy(Val, 'assertCheck');

        TH.loginAs(await Factory.createUser('judge'));

        await assert.exception(() => rpc('Climber.clearAllNumbers'), {error: 403});

        assert.calledWith(Val.assertCheck, undefined, 'id');
      });

      test('success', async () => {
        const rpc = TH.mockRpc();

        await TH.loginAs(await Factory.createUser('admin'));

        const c1 = await Factory.createClimber({number: 123});
        const c2 = await Factory.createClimber({number: 456});

        const org2 = await Factory.createOrg();

        const c3 = await Factory.createClimber({number: 123});

        await rpc('Climber.clearAllNumbers', org._id);

        assert.same((await c1.$reload(true)).number, undefined);
        assert.same((await c2.$reload(true)).number, undefined);
        assert.same((await c3.$reload(true)).number, 123);
      });
    });

    group('authorize', () => {
      test('denied', async () => {
        const oOrg = await Factory.createOrg();
        const oUser = await Factory.createUser();

        const climber = await Factory.buildClimber();

        await assert.accessDenied(() => climber.authorize(user._id));
      });

      test('allowed', async () => {
        const climber = await Factory.buildClimber();

        await refute.accessDenied(() => climber.authorize(user._id));
      });

      test('okay to remove', async () => {
        const climber = await Factory.createClimber();

        await refute.accessDenied(() => climber.authorize(user._id, {remove: true}));
      });

      test('remove in use', async () => {
        const climber = await Factory.createClimber();
        const competitor = await Factory.createCompetitor();

        await assert.accessDenied(() => climber.authorize(user._id, {remove: true}));
      });
    });
  });
});
