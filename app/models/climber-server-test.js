define(function (require, exports, module) {
  var test, v;
  const koru    = require('koru');
  const Val     = require('koru/model/validation');
  const session = require('koru/session');
  const TH      = require('test-helper');
  const Climber = require('./climber');
  const Org     = require('./org');
  const Result  = require('./result');
  const User    = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
      test.stub(koru, 'info');
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test merge"() {
      v.rpc = TH.mockRpc();
      test.stub(Val, 'assertCheck');
      test.spy(Climber.prototype, 'authorize');

      TH.login();

      const c1 = TH.Factory.createClimber();
      const c2 = TH.Factory.createClimber();
      const comp21 = TH.Factory.createCompetitor();
      const comp22 = TH.Factory.createCompetitor();
      const result21 = TH.Factory.createResult();

      const c3 = TH.Factory.createClimber();
      const comp31 = TH.Factory.createCompetitor();
      const result31 = TH.Factory.createResult();

      const c4 = TH.Factory.createClimber();
      const comp41 = TH.Factory.createCompetitor();
      const result41 = TH.Factory.createResult();

      const myConns = {
        a: {org_id: c1.org_id, sendBinary: test.stub()},
        b: {org_id: c1.org_id, sendBinary: test.stub()},
        c: {org_id: 'other', sendBinary: test.stub()},
      };

      TH.stubProperty(session, 'conns', {value: myConns});

      v.rpc("Climber.merge", c1._id, [c2._id, c3._id]);

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
    },

    "authorize": {
      "test denied"() {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var climber = TH.Factory.buildClimber();

        assert.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var climber = TH.Factory.buildClimber();

        refute.accessDenied(function () {
          climber.authorize(v.user._id);
        });
      },

      "test okay to remove"() {
        var climber = TH.Factory.createClimber();

        refute.accessDenied(function () {
          climber.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use"() {
        var climber = TH.Factory.createClimber();
        var competitor = TH.Factory.createCompetitor();

        assert.accessDenied(function () {
          climber.authorize(v.user._id, {remove: true});
        });

      },
    },

  });
});
