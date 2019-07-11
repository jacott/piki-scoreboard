define((require, exports, module)=>{
  const koru            = require('koru');
  const session         = require('koru/session');
  const util            = require('koru/util');
  const Role            = require('models/role');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, intercept} = TH;

  const User = require('./user');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("DEFAULT_USER_ID", ()=>{
      assert.same(session.DEFAULT_USER_ID, 'guest');
    });

    test("me", ()=>{
      let _id = 'guest';

      intercept(koru, 'userId', ()=> _id);

      const guest = User.me();

      assert.same(guest._id, 'guest');

      assert.same(User.me(), guest);

      const user = Factory.createUser();
      _id = user._id;

      assert.same(User.me()._id, _id);
    });

    test("isGuest", ()=>{
      /**
       * Current user is guest only if logged in with koru.userId() 'guest' which is the default
       * user ID
       **/
      const adminUser = Factory.createUser({role: 'a'});
      const user = Factory.createUser({role: 'j'});
      const su = Factory.createUser('su');
      const guest = isServer ? User.guestUser() : Factory.createUser({_id: 'guest'});

      TH.loginAs(adminUser);
      assert.isFalse(User.isGuest());
      TH.loginAs(user);
      assert.isFalse(User.isGuest());
      TH.loginAs(su);
      assert.isFalse(User.isGuest());
      TH.loginAs(guest);
      assert.isTrue(User.isGuest());
    });

    test("fetchAdminister", ()=>{
      TH.noInfo();
      const user = Factory.createUser();

      const ca = stub(User.prototype, 'canAdminister').returns(false);

      assert.accessDenied(()=>{
        User.fetchAdminister(user._id, 'x');
      });

      assert.calledOnceWith(ca, 'x');
      assert.same(ca.firstCall.thisValue._id, user._id);

       assert.accessDenied(()=>{
        User.fetchAdminister('123');
      });

      ca.returns(true);

      assert.same(User.fetchAdminister(user._id)._id, user._id);
    });

    test("emailWithName", ()=>{
      const user = Factory.buildUser();
      assert.same(user.emailWithName(), 'fn user 1 <email-user.1@test.co>');

    });
    test("creation", ()=>{
      const user=Factory.createUser();
      const us = User.findById(user._id);

      assert(us);
    });

    test("standard validators", ()=>{
      const validators = User._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true],
      });
      assert.validators(validators.email, {
        maxLength: [200], required: [true], trim: [true],
        inclusion: [{allowBlank: true, matches: util.EMAIL_RE}],
        normalize: ['downcase'],
        unique: [true],
      });
      assert.validators(validators.initials, {
        maxLength: [3], required: [true], trim: [true],
      });
    });
  });
});
