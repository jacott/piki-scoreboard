(function (test, v) {
  buster.testCase('lib/client/form/page-link:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
      delete Bart.Foo;
    },

    "test pageLink": function () {
      test.stub(AppRoute, 'gotoPath');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", name: "foo bar", link: "/foo/bar"}));

      assert.dom(document.body, function () {
        assert.dom('button#foo.link', 'foo bar', function () {
          TH.click(this);
        });
      });

      assert.calledWith(AppRoute.gotoPath, '/foo/bar');
    },

    "test template pageLink": function () {
      Bart.newTemplate({name: "Foo.Bar"});

      test.stub(AppRoute, 'gotoPage');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", name: "foo bar", template: "Foo.Bar"}));

      TH.click('#foo');

      assert.calledWith(AppRoute.gotoPage, Bart.Foo.Bar);
    },
  });
})();
