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

    "test rendering": function () {
      test.stub(AppRoute, 'gotoPath');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", name: 'baz', value: "foo bar", link: "/foo/bar"}));

      assert.dom(document.body, function () {
        assert.dom('button#foo.link[name=baz]', 'foo bar', function () {
          TH.click(this);
        });
      });

      assert.calledWith(AppRoute.gotoPath, '/foo/bar');
    },

    "test append": function () {
      Bart.newTemplate({name: "Foo.Bar"});

      test.stub(AppRoute, 'gotoPage');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", value: "foo bar", template: "Foo.Bar", append: "1234"}));

      TH.click('#foo');

      assert.calledWith(AppRoute.gotoPage, Bart.Foo.Bar, {append: "1234"});
    },

    "test template": function () {
      Bart.newTemplate({name: "Foo.Bar"});

      test.stub(AppRoute, 'gotoPage');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", value: "foo bar", template: "Foo.Bar"}));

      TH.click('#foo');

      assert.calledWith(AppRoute.gotoPage, Bart.Foo.Bar);
    },
  });
})();
