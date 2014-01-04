(function (test, v) {
  buster.testCase('models/server/user:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppModel.User.clearMemDocs();
      v = null;
    },

    "test authorize": function () {
      var subject = TH.Factory.createUser();
      var user = TH.Factory.createUser('su');

      refute.accessDenied(function () {
        subject.authorize(user._id);
      });

      user = TH.Factory.createUser();

      assert.accessDenied(function () {
        subject.authorize(user._id);
      });
    },

    "test guestUserId": function () {
      var org = TH.Factory.createOrg();
      var user = AppModel.User.guestUser();

      assert.same(user.org_id, org._id);
      refute.same(AppModel.User.guestUser(), user);

      AppModel.User.addMemDoc(user.attributes);
      assert.same(AppModel.User.guestUser().attributes, user.attributes);
    },
  });
})();
