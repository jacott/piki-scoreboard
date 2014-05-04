(function (test, v) {
  buster.testCase('packages/app-pages/test/markdown:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test getMentionIds": function () {
      var md = "Hello @[Bob](123), how is @[Sally](567)";
      assert.equals(App.Markdown.getMentionIds(md), ['123', '567']);
    },
  });
})();
