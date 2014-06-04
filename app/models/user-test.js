define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var util = require('koru/util');
  var User = require('./user');

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
