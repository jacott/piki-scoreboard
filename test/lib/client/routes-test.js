(function (test, v) {
  buster.testCase('lib/client/routes:', {
    setUp: function () {
      test = this;
      v = {};
      v.FooBar = {
        name: 'FooBar',
        onEntry: test.stub(),
        onExit: test.stub(),
      };
    },

    tearDown: function () {
      v = null;
      delete AppRoute.routes['/foo-bar'];
      delete AppRoute.routes['/foo-bar/baz'];
    },

    "test addTemplate": function () {
      var Baz = {
        name: 'Baz',
        parent: v.FooBar,

        $autoRender: function (arg) {
          return Bart.html('<div id="Baz">'+arg+'</div>');
        },
      };

      AppRoute.addTemplate(v.FooBar);
      AppRoute.addTemplate(Baz, {data: function () {return 'fooData'}});

      assert.same(AppRoute.routes['/foo-bar/baz'], Baz);
      assert.same(AppRoute.routes['/foo-bar'], v.FooBar);

      assert.same(Baz.PATHNAME, '/foo-bar/baz');

      assert.isFunction(Baz.onEntry);

      Baz.onEntry();

      assert.select('#Baz', 'fooData');

      Baz.onExit();

      refute.select('#Baz');
    },

    "test default setByLocation": function () {
      AppRoute.addRoute('/context.html', v.FooBar);

      AppRoute.setByLocation();
      assert.calledWith(v.FooBar.onEntry, document.location);
    },

    "test addRoute setByLocation": function () {
      var Bar = {
        onEntry: test.stub(),
      };
      AppRoute.addRoute('/foo-bar', v.FooBar);
      assert.exception(function () {
        AppRoute.addRoute('/foo-bar', v.FooBar);
      });

      AppRoute.addRoute('/bar', Bar);

      AppRoute.setByLocation(v.loc = {pathname: '/foo-bar', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, v.loc, {abc: '123', def: '456'});

      v.loc = {pathname: '/bar'};
      AppRoute.setByLocation(v.loc.pathname);

      assert.calledWith(v.FooBar.onExit, v.loc, undefined);
      assert.calledWith(Bar.onEntry, v.loc, undefined);
    },

    "test default": function () {
      var def = AppRoute.getDefault();
      test.onEnd(function () {
        AppRoute.setDefault(def);
      });

      AppRoute.setDefault(v.FooBar);
      assert.same(AppRoute.getDefault(), v.FooBar);

      AppRoute.setByLocation(v.loc = {pathname: '/anything', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, v.loc, {abc: '123', def: '456'});
    },
  });
})();
