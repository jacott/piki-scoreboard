(function (test, v) {
  buster.testCase('lib/client/form/page-link:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test pageLink": function () {
      test.stub(AppRoute, 'gotoPath');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", name: "foo bar", link: "/foo/bar"}));

      assert.select(document.body, function () {
        assert.select('button#foo', 'foo bar', function () {
          TH.click(this);
        });
      });

      assert.calledWith(AppRoute.gotoPath, '/foo/bar');
    },
  });
})();
