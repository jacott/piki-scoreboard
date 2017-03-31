define(function (require, exports, module) {
  const publish = require('koru/session/publish');
  const TH      = require('./test-helper');

  require('./publish-org');
  var test, v;

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.sub = TH.mockClientSub();
    },

    tearDown() {
      TH.cleanUpTest(v);
      v = null;
    },

    "test publish"() {
      var sut = publish._pubs.Org;
      var matchUser = v.sub.match.withArgs('User', TH.match.func);

      var org = TH.Factory.createOrg({shortName: 'o1'});

      sut.call(v.sub, 'o1');

      assert.calledOnce(matchUser);

      var m = matchUser.args(0, 1);

      assert.isTrue(m({org_id: org._id}));
      assert.isFalse(m({org_id: 'x'+org._id}));

      'User Climber Event Series Category Team TeamType'.split(' ').forEach(function (name) {
        assert.calledWith(v.sub.match, name, m);
      });
    },
  });
});
