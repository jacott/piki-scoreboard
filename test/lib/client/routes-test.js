(function (test, v) {
  buster.testCase('lib/client/routes:', {
    setUp: function () {
      test = this;
      v = {};
      v.Foo = {
        onEntry: test.stub(),
        onExit: test.stub(),
      };
    },

    tearDown: function () {
      v = null;
    },

    "test default setByLocation": function () {
      AppRoute.addRoute('/context.html', v.Foo);

      AppRoute.setByLocation();
      assert.calledWith(v.Foo.onEntry, document.location);
    },

    "test addRoute setByLocation": function () {
      var Bar = {
        onEntry: test.stub(),
      };
      AppRoute.addRoute('/foo', v.Foo);
      assert.exception(function () {
        AppRoute.addRoute('/foo', v.Foo);
      });

      AppRoute.addRoute('/bar', Bar);

      AppRoute.setByLocation(v.loc = {pathname: '/foo', search: '?abc=123&def=456'});

      assert.calledWith(v.Foo.onEntry, v.loc, {abc: '123', def: '456'});

      v.loc = {pathname: '/bar'};
      AppRoute.setByLocation(v.loc.pathname);

      assert.calledWith(v.Foo.onExit, v.loc, undefined);
      assert.calledWith(Bar.onEntry, v.loc, undefined);
    },

    "test default": function () {
      var def = AppRoute.getDefault();
      test.onEnd(function () {
        AppRoute.setDefault(def);
      });

      AppRoute.setDefault(v.Foo);
      assert.same(AppRoute.getDefault(), v.Foo);

      AppRoute.setByLocation(v.loc = {pathname: '/anything', search: '?abc=123&def=456'});

      assert.calledWith(v.Foo.onEntry, v.loc, {abc: '123', def: '456'});
    },
  });
})();
