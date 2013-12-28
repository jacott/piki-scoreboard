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

    "test default gotoPath": function () {
      AppRoute.addRoute('/context.html', v.FooBar);

      AppRoute.gotoPath();
      assert.called(v.FooBar.onEntry);
    },

    "test addRoute gotoPath": function () {
      var Bar = {
        onEntry: test.stub(),
      };
      AppRoute.addRoute('/foo-bar', v.FooBar);
      assert.exception(function () {
        AppRoute.addRoute('/foo-bar', v.FooBar);
      });

      AppRoute.addRoute('/bar', Bar);

      AppRoute.gotoPath(v.loc = {pathname: '/foo-bar', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, {abc: '123', def: '456'});

      v.loc = {pathname: '/bar'};
      AppRoute.gotoPath(v.loc.pathname);

      assert.calledWith(v.FooBar.onExit, Bar, undefined);
      assert.calledWith(Bar.onEntry, undefined);
    },

    "test default": function () {
      var def = AppRoute.getDefault();
      test.onEnd(function () {
        AppRoute.setDefault(def);
      });

      AppRoute.setDefault(v.FooBar);
      assert.same(AppRoute.getDefault(), v.FooBar);

      AppRoute.gotoPath(v.loc = {pathname: '/anything', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, {abc: '123', def: '456'});
    },
  });
})();
