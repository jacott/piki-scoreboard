define(function (require, exports, module) {
  var test, v;
  const koru            = require('koru');
  const util            = require('koru/util');
  const Role            = require('models/role');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');
  const User            = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test isGuest"() {
      /**
       * Current user is guest only if logged in with koru.userId() 'guest'
       **/
      var adminUser = Factory.createUser({role: 'a'});
      var user = Factory.createUser({role: 'j'});
      var su = Factory.createUser('su');
      var guest = isServer ? User.guestUser() : Factory.createUser({_id: 'guest'});

      // not logged in
      assert.isFalse(User.isGuest());

      TH.loginAs(adminUser);
      assert.isFalse(User.isGuest());
      TH.loginAs(user);
      assert.isFalse(User.isGuest());
      TH.loginAs(su);
      assert.isFalse(User.isGuest());
      TH.loginAs(guest);
      assert.isTrue(User.isGuest());
    },

    "test fetchAdminister"() {
      test.stub(koru, 'info');
      var user = Factory.createUser();

      var ca = test.stub(User.prototype, 'canAdminister').returns(false);

      assert.accessDenied(function () {
        User.fetchAdminister(user._id, 'x');
      });

      assert.calledOnceWith(ca, 'x');
      assert.same(ca.firstCall.thisValue._id, user._id);

       assert.accessDenied(function () {
        User.fetchAdminister('123');
      });

      ca.returns(true);

      assert.same(User.fetchAdminister(user._id)._id, user._id);
    },

    "test emailWithName"() {
      var user = Factory.buildUser();
      assert.same(user.emailWithName(), 'fn user 1 <email-user.1@test.co>');

    },
    'test creation'() {
      var user=Factory.createUser();
      var us = User.findById(user._id);

      assert(us);
    },

    'test standard validators'() {
      var validators = User._fieldValidators;

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
    },
  });
});
