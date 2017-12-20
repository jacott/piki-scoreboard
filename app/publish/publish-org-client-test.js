define(function (require, exports, module) {
  const publish         = require('koru/session/publish');
  const TH              = require('./test-helper');

  require('./publish-org');

  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {};
      v.sub = TH.mockClientSub();
    },

    tearDown() {
      TH.cleanUpTest(v);
      v = null;
    },

    "test publish"() {
      const sut = publish._pubs.Org;
      const matchUser = v.sub.match.withArgs('User', TH.match.func);
      const matchEvent = v.sub.match.withArgs('Event', TH.match.func);

      const org = TH.Factory.createOrg({shortName: 'o1'});

      sut.call(v.sub, 'o1');

      {
        assert.calledOnce(matchUser);

        const m = matchUser.args(0, 1);

        assert.isTrue(m({org_id: org._id, role: 'a'}));
        assert.isFalse(m({org_id: org._id, role: undefined}));
        assert.isFalse(m({org_id: 'x'+org._id, role: 'a'}));
      }

      {
        assert.calledOnce(matchEvent);

        const m = matchEvent.args(0, 1);

        assert.isTrue(m({org_id: org._id}));
        assert.isFalse(m({org_id: 'x'+org._id}));

        'Climber Event Series Category Team TeamType'.split(' ')
          .forEach(name =>{assert.calledWith(v.sub.match, name, m)});
      }
    },
  });
});
