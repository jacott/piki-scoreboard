define(function (require, exports, module) {
  var test, v;
  const koru = require('koru');
  const util = require('koru/util');
  const TH   = require('test-helper');
  const User = require('./user');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test org_id required"() {
      TH.loginAs(TH.Factory.createUser('su'));
      var user = TH.Factory.buildUser({role: 's', org_id: null});

      assert(user.$isValid(), TH.showErrors(user));

      user.role = 'a';
      refute(user.$isValid());
    },

    "test isSuperUser"() {
      var user = TH.Factory.buildUser('su');

      assert.isFalse(user.isSuperUser());
      user.attributes.role = 's';

      assert.isTrue(user.isSuperUser());

      user.attributes.role = 'x';
      assert.isFalse(user.isSuperUser());
    },

    "test isAdmin"() {
      var adminUser = TH.Factory.createUser({role: 'a'});
      var user = TH.Factory.createUser({role: 'j'});
      var su = TH.Factory.createUser('su');

      assert.isFalse(user.isAdmin());
      user.role = 'a';
      assert.isFalse(user.isAdmin());

      assert.isTrue(adminUser.isAdmin());
      assert.isTrue(su.isAdmin());

    },

    "test canAdminister"() {
      var doc = new User({org_id: '123'});
      doc.attributes.role = User.ROLE.superUser;

      assert(doc.canAdminister());
      assert(doc.canAdminister('x'));

      doc.attributes.role = User.ROLE.admin;

      assert(doc.canAdminister());
      assert(doc.canAdminister({attributes: {org_id: doc.org_id}}));
      assert(doc.canAdminister({attributes: {}, org_id: doc.org_id}));
      refute(doc.canAdminister({attributes: {org_id: '456'}, org_id: doc.org_id}));

      doc.attributes.role = User.ROLE.judge;
      doc.changes.role = User.ROLE.superUser;

      assert.same(doc.safeRole, User.ROLE.judge);

      refute(doc.canAdminister());
    },

    "test fetchAdminister"() {
      test.stub(koru, 'info');
      var user = TH.Factory.createUser();

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
      var user = TH.Factory.buildUser();
      assert.same(user.emailWithName(), 'fn user 1 <email-user.1@test.co>');

    },
    'test creation'() {
      var user=TH.Factory.createUser();
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
