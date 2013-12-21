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
