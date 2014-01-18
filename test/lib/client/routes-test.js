(function (test, v) {
  buster.testCase('lib/client/routes:', {
    setUp: function () {
      test = this;
      v = {
        root: AppRoute.root,
        onGotoPath: AppRoute._onGotoPath,
      };
      v.FooBar = {
        name: 'FooBar',
        $autoRender: test.stub(),
        onEntry: test.stub(),
        onExit: test.stub(),
      };
      AppRoute.root = new AppRoute();
      AppRoute._onGotoPath = null;
      test.stub(AppRoute.history, 'pushState');
      test.stub(AppRoute.history, 'replaceState');
      test.stub(App, 'userId').returns("123");
    },

    tearDown: function () {
      AppRoute.root = v.root;
      AppRoute._onGotoPath = v.onGotoPath;
      AppRoute.gotoPage();
      v = null;
    },

    "test focus": function () {
      var RootBar = {
        name: 'RootBar',
        $autoRender: function () {
          return Bart.html('<div id="RootBar">x</div>');
        },
      };

      AppRoute.root.addTemplate(RootBar, {focus: '[name=foo]'});

      test.stub(Bart, 'focus');

      AppRoute.gotoPage(RootBar);

      assert.dom('#RootBar', function () {
        assert.calledWith(Bart.focus, this, '[name=foo]');
      });
    },

    "test append": function () {
      var RootBar = {
        name: 'RootBar',
        $autoRender: function () {
          return Bart.html('<div id="RootBar">x</div>');
        },
      };

      AppRoute.root.addTemplate(RootBar);
      AppRoute.gotoPage(RootBar, {append: "an-id"});

      assert.calledWith(AppRoute.history.pushState, null, 'Piki', '/root-bar/an-id');
    },

    "test abort page change": function () {
      var Baz = {
        name: 'Baz',
        onBaseEntry: function () {
          AppRoute.abortPage(RootBar);
        },
        onBaseExit: test.stub(),
      };

      var RootBar = {
        name: 'RootBar',
        $autoRender: test.stub(),
        onEntry: test.stub(),
        onExit: test.stub(),
      };

      AppRoute.root.addTemplate(RootBar);
      AppRoute.root.addBase(Baz);
      Baz.route.addTemplate(v.FooBar);


      AppRoute.gotoPage(v.FooBar);

      refute.called(v.FooBar.onEntry);
      assert.called(RootBar.onEntry);
    },

    "test push history": function () {
      assert.same(AppRoute._orig_history, window.history);

      AppRoute.root.addTemplate(v.FooBar);
      v.FooBar.onEntry = function () {
        AppRoute.title = "foo title";
      };

      AppRoute.gotoPage(v.FooBar);

      assert.calledWith(AppRoute.history.pushState, null, "foo title", '/foo-bar');
    },

    "test replace history": function () {
      AppRoute.title = "baz bar";
      AppRoute.root.addTemplate(v.FooBar);
      AppRoute.replacePath(v.FooBar);

      assert.calledWith(AppRoute.history.replaceState, null, "baz bar", '/foo-bar');
    },

    "test pageChanged": function () {
      test.stub(AppRoute, 'gotoPath');
      AppRoute.root.addTemplate(v.FooBar);
      AppRoute.pageChanged();

      assert.calledWithExactly(AppRoute.gotoPath);

      AppRoute.gotoPath.restore();
      AppRoute.gotoPath('/foo-bar');

      refute.called(AppRoute.history.pushState);
      refute.called(AppRoute.history.replaceState);
    },

    "test root": function () {
      assert.same(v.root.constructor, AppRoute);
    },

    "test onGotoPath": function () {
      AppRoute.root.addTemplate(v.FooBar);
      AppRoute.onGotoPath(function (path) {
        v.path = path;
        return '/foo-bar';
      });

      AppRoute.gotoPath('/testing');

      assert.same(v.path, '/testing');


      assert.calledWith(v.FooBar.onEntry, v.FooBar, {pathname: '/testing'});
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

      AppRoute.gotoPath(BazBar);

      assert.called(v.FooBar.onExit);
      assert.called(BazBar.onEntry);

      assert.called(Fnord.onBaseExit);
      refute.called(Baz.onBaseExit);

      v.FooBar.onEntry.reset();
      Baz.onBaseEntry.reset();
      Fnord.onBaseEntry.reset();
      Fnord.onBaseExit.reset();

      Fnord.onBaseEntry.reset();


      AppRoute.gotoPage(v.FooBar);

      var loc = {pathname: "/baz/fnord/foo-bar"};

      assert.calledWith(BazBar.onExit, v.FooBar, loc);
      assert.calledWith(v.FooBar.onEntry, v.FooBar, loc);

      assert.calledWith(Fnord.onBaseEntry, v.FooBar, loc);
      refute.called(Baz.onBaseExit);

      AppRoute.gotoPage(RootBar);

      assert.calledWith(Baz.onBaseExit, RootBar, { pathname: "/root-bar" });
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

      assert.dom('#Baz', 'fooData');

      Baz.onExit();

      refute.dom('#Baz');
    },

    "test gotoPath default": function () {
      AppRoute.root.addTemplate(v.FooBar);
      // tests are run from /context.html so need to fudge the route;
      AppRoute.root.routes[document.location.pathname.split('/')[1]] = AppRoute.root.routes['foo-bar'];

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

      assert.calledWith(v.FooBar.onEntry, v.FooBar, v.loc);

      v.loc = {pathname: '/bar'};
      AppRoute.gotoPath(v.loc.pathname);

      assert.calledWith(v.FooBar.onExit, Bar, v.loc);
      assert.calledWith(Bar.onEntry, Bar, v.loc);
    },

    "test default": function () {
      AppRoute.root.defaultPage = v.FooBar;

      AppRoute.gotoPath(v.loc = {pathname: '/anything', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, v.FooBar, v.loc);
    },
  });
})();
