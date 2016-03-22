define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var util = require('koru/util');
  var User = require('./user');
  var koru = require('koru');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test org_id required": function () {
      TH.loginAs(TH.Factory.createUser('su'));
      var user = TH.Factory.buildUser({role: 's', org_id: null});

      assert(user.$isValid(), TH.showErrors(user));

      user.role = 'a';
      refute(user.$isValid());
    },

    "test isSuperUser": function () {
      var user = TH.Factory.buildUser('su');

      assert.isFalse(user.isSuperUser());
      user.attributes.role = 's';

      assert.isTrue(user.isSuperUser());

      user.attributes.role = 'x';
      assert.isFalse(user.isSuperUser());
    },

    "test canAdminister": function () {
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

      refute(doc.canAdminister());
    },

    "test fetchAdminister": function () {
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

    "test emailWithName": function () {
      var user = TH.Factory.buildUser();
      assert.same(user.emailWithName(), 'fn user 1 <email-user.1@test.co>');

    },
    'test creation': function () {
      var user=TH.Factory.createUser();
      var us = User.findById(user._id);

      assert(us);
    },

    'test standard validators': function () {
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
