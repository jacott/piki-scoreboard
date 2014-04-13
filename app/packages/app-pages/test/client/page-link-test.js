(function (test, v) {
  buster.testCase('packages/app-pages/test/client/page-link:', {
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
          refute(this.getAttribute('link'));
          refute(this.getAttribute('value'));
          TH.click(this);
        });
      });

      assert.calledWith(AppRoute.gotoPath, '/foo/bar');
    },

    "test append": function () {
      Bart.newTemplate({name: "Foo.Bar"});

      test.stub(AppRoute, 'gotoPath');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", value: "foo bar", template: "Foo.Bar", append: "1234"}));

      assert.dom('#foo', function () {
        refute(this.getAttribute('append'));
        TH.click(this);
      });

      assert.calledWith(AppRoute.gotoPath, Bart.Foo.Bar, {append: "1234"});
    },

    "test search": function () {
      Bart.newTemplate({name: "Foo.Bar"});

      test.stub(AppRoute, 'gotoPath');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", value: "foo bar", template: "Foo.Bar", search: "foo=bar"}));

      assert.dom('#foo', function () {
        refute(this.getAttribute('search'));
        TH.click(this);
      });

      assert.calledWith(AppRoute.gotoPath, Bart.Foo.Bar, {search: "?foo=bar"});
    },

    "test template": function () {
      Bart.newTemplate({name: "Foo.Bar"});

      test.stub(AppRoute, 'gotoPage');
      document.body.appendChild(Bart._helpers.pageLink({id: "foo", value: "foo bar", template: "Foo.Bar"}));

      assert.dom('#foo', function () {
        refute(this.getAttribute('template'));
        TH.click(this);
      });

      assert.calledWith(AppRoute.gotoPage, Bart.Foo.Bar);
    },
  });
})();
