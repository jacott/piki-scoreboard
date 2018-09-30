define((require, exports, module)=>{
  const publish         = require('koru/session/publish');
  const Category        = require('models/category');
  const Factory         = require('test/factory');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  require('./publish-org-client');

  const sut = publish._pubs.Org;

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v.sub = TH.mockClientSub();
    });

    afterEach(()=>{
      TH.cleanUpTest(v);
      v = {};
    });

    test("user not in org", ()=>{
      TH.loginAs(v.user = Factory.createUser('admin'));
      const org = Factory.createOrg({shortName: 'o1'});
      sut.init.call(v.sub, 'o1');

      assert.same(v.user.org, org);
      assert.same(v.user.role, 'g');
    });

    test("user not logged in", ()=>{
      const org = Factory.createOrg({shortName: 'o1'});
      refute.exception(()=>{sut.init.call(v.sub, 'o1')});
    });

    test("publish", ()=>{
      const {sub} = v;
      const matchUser = sub.match.withArgs('User', TH.match.func);
      const matchEvent = sub.match.withArgs('Event', TH.match.func);

      const org = Factory.createOrg({shortName: 'o1'});
      const user = Factory.createUser('admin');
      const cat = Factory.createCategory();
      TH.loginAs(user);

      sut.init.call(sub, 'o1');

      assert.same(user.org, org);
      assert.same(user.role, 'a');

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
          .forEach(name =>{assert.calledWith(sub.match, name, m)});
      }

      const unmatch = stub();
      sub._onStop(sub, unmatch);

      assert.calledWith(unmatch, user);
      assert.calledWith(unmatch, cat);
    });
  });
});
