(function (test, v) {
  buster.testCase('models/user:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
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
      var us = AppModel.User.findOne(user._id);

      assert(us);
    },

    'test standard validators': function () {
      var validators = AppModel.User._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.email, {maxLength: [200], required: [true], trim: [true],
                                           inclusion: [{allowBlank: true, matches: Apputil.EMAIL_RE }], normalize: ['downcase']});
      assert.validators(validators.initials, {maxLength: [3], required: [true], trim: [true]});
    },
  });
})();
