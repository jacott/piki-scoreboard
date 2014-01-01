(function (test, v) {
  buster.testCase('lib/client/routes:', {
    setUp: function () {
      test = this;
      v = {
        root: AppRoute.root,
      };
      v.FooBar = {
        name: 'FooBar',
        $autoRender: test.stub(),
        onEntry: test.stub(),
        onExit: test.stub(),
      };
      AppRoute.root = new AppRoute();
    },

    tearDown: function () {
      AppRoute.root = v.root;
      AppRoute.gotoPage();
      v = null;
    },

    "test root": function () {
      assert.same(v.root.constructor, AppRoute);
    },

    "test addBase": function () {
      var Baz = {
        name: 'Baz',
        onBaseEntry: test.stub(),
        onBaseExit: test.stub(),
      };

      var Fnord = {
        name: 'Fnord',
        onBaseEntry: test.stub(),
        onBaseExit: test.stub(),
      };

      var BazBar = {
        name: 'Baz',
        $autoRender: test.stub(),
        onEntry: test.stub(),
        onExit: test.stub(),
      };

      var RootBar = {
        name: 'RootBar',
        $autoRender: test.stub(),
        onEntry: test.stub(),
        onExit: test.stub(),
      };

      AppRoute.root.addTemplate(RootBar);

      AppRoute.root.addBase(Baz);
      Baz.route.addBase(Fnord);
      Fnord.route.addTemplate(v.FooBar);
      Baz.route.addTemplate(BazBar);

      assert.same(Fnord.route.path, 'fnord');
      assert.same(Fnord.route.parent, Baz.route);

      AppRoute.gotoPath('baz//fnord/foo-bar');

      assert.called(v.FooBar.onEntry);
      assert.called(Baz.onBaseEntry);
      assert.called(Fnord.onBaseEntry);

      AppRoute.gotoPage(BazBar);

      assert.called(v.FooBar.onExit);
      assert.called(BazBar.onEntry);

      assert.called(Fnord.onBaseExit);
      refute.called(Baz.onBaseExit);

      v.FooBar.onEntry.reset();
      Baz.onBaseEntry.reset();
      Fnord.onBaseEntry.reset();
      Fnord.onBaseExit.reset();

      AppRoute.gotoPage(v.FooBar);

      var loc = {pathname: "/baz/fnord/foo-bar"};

      assert.calledWith(BazBar.onExit, v.FooBar, loc);
      assert.calledWith(v.FooBar.onEntry, loc);

      assert.calledWith(Fnord.onBaseEntry, loc);
      refute.called(Baz.onBaseExit);

      AppRoute.gotoPage(RootBar);

      assert.calledWith(Baz.onBaseExit, { pathname: "/root-bar" });
    },

    "test addTemplate": function () {
      var Baz = {
        name: 'Baz',
        parent: v.FooBar,

        $autoRender: function (arg) {
          return Bart.html('<div id="Baz">'+arg+'</div>');
        },
      };

      AppRoute.root.addTemplate(v.FooBar);
      AppRoute.root.addTemplate(Baz, {data: function () {return 'fooData'}});

      assert.isFunction(Baz.onEntry);

      Baz.onEntry();

      assert.select('#Baz', 'fooData');

      Baz.onExit();

      refute.select('#Baz');
    },

    "test gotoPath default": function () {
      AppRoute.root.addTemplate(v.FooBar);
      // tests are run from /context.html so need to fudge the route;
      AppRoute.root.routes['context.html'] = AppRoute.root.routes['foo-bar'];

      AppRoute.gotoPath();
      assert.called(v.FooBar.onEntry);
    },

    "test addTemplate gotoPath": function () {
      var Bar = {
        name: 'Bar',
        $autoRender: test.stub(),
        onEntry: test.stub(),
      };
      AppRoute.root.addTemplate(v.FooBar);
      assert.exception(function () {
        AppRoute.root.addTemplate('foo-bar', v.FooBar);
      });

      AppRoute.root.addTemplate(Bar);

      AppRoute.gotoPath(v.loc = {pathname: '/foo-bar'});

      assert.calledWith(v.FooBar.onEntry, v.loc);

      v.loc = {pathname: '/bar'};
      AppRoute.gotoPath(v.loc.pathname);

      assert.calledWith(v.FooBar.onExit, Bar, v.loc);
      assert.calledWith(Bar.onEntry, v.loc);
    },

    "test default": function () {
      AppRoute.root.defaultPage = v.FooBar;

      AppRoute.gotoPath(v.loc = {pathname: '/anything', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, v.loc);
    },
  });
})();
