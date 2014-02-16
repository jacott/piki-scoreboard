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

    "with routeVar": {
      setUp: function () {
        v.Baz = {
          name: 'Baz',
          path: 'baz',
          onBaseEntry: test.stub(),
          onBaseExit: test.stub(),
        };

        v.RootBar = {
          name: 'RootBar',
          $autoRender: function () {
            return Bart.html('<div id="RootBar">x</div>');
          },
          onEntry: test.stub(),
          onExit: test.stub(),
        };

        AppRoute.root.addBase(v.Baz, 'bazId');
        v.Baz.route.addTemplate(v.RootBar);
      },


      "test default root": function () {
        AppRoute.root.routeVar = 'fooId';
        test.stub(AppRoute, 'gotoPage');
        AppRoute.root.defaultPage = v.RootBar;

        AppRoute.gotoPath('/xyz');

        assert.calledWith(AppRoute.gotoPage, v.RootBar, {fooId: "xyz", pathname: "/xyz"});
      },

      "test root pageRoute": function () {
        AppRoute.root.routeVar = 'fooId';
        AppRoute.root.onBaseEntry = test.stub();

        // test no pageRoute set
        AppRoute.gotoPath('/baz/root-bar');
        assert.calledWith(AppRoute.root.onBaseEntry, v.RootBar, {pathname: "/baz/root-bar"});


        // test baz routeVar changed (but not root routeVar)
        AppRoute.root.onBaseEntry.reset();
        v.Baz.onBaseEntry.reset();

        AppRoute.gotoPath('/baz/an-id/root-bar');
        refute.called(AppRoute.root.onBaseEntry);
        assert.calledWith(v.Baz.onBaseExit, v.RootBar, {bazId: "an-id", pathname: "/baz/an-id/root-bar"});
        assert.calledWith(v.Baz.onBaseEntry, v.RootBar, {bazId: "an-id", pathname: "/baz/an-id/root-bar"});

        // test root routeVar changed
        AppRoute.root.onBaseEntry.reset();

        AppRoute.gotoPath('/xyz/baz/an-id/root-bar');
        assert.calledWith(AppRoute.root.onBaseEntry, v.RootBar, {bazId: "an-id", fooId: "xyz", pathname: "/xyz/baz/an-id/root-bar"});

        // test no pageRoute passed to gotoPage
        AppRoute.root.onBaseEntry.reset();
        v.Baz.onBaseEntry.reset();

        AppRoute.gotoPage(v.RootBar);
        refute.called(AppRoute.root.onBaseEntry);
        refute.called(v.Baz.onBaseEntry);
        assert.calledWith(v.RootBar.onEntry, v.RootBar, {bazId: "an-id", fooId: "xyz", pathname: "/xyz/baz/an-id/root-bar"});
      },

      "test gotoPath": function () {
        test.stub(AppRoute, 'gotoPage');

        AppRoute.gotoPath('/baz/an-id/root-bar');
        assert.calledWith(AppRoute.gotoPage, v.RootBar, {bazId: "an-id", pathname: '/baz/an-id/root-bar'});

        AppRoute.gotoPath('/baz/diff-id/root-bar');
        assert.calledWith(AppRoute.gotoPage, v.RootBar, {bazId: "diff-id", pathname: '/baz/diff-id/root-bar'});
      },

      "test gotoPage": function () {
        var orig = Bart.setTitle;
        Bart.setTitle = test.stub();
        test.onEnd(function () {
          Bart.setTitle = orig;
        });
        v.RootBar.onEntry = function (page) {
          page.title = 'Root bar';
        };
        AppRoute.gotoPage(v.RootBar, {bazId: "an-id", append: 'one/two'});
        assert.calledWith(AppRoute.history.pushState, null, 'Root bar', '/baz/an-id/root-bar/one/two');

        AppRoute.gotoPage(v.RootBar, {bazId: "diff-id"});
        assert.calledWith(AppRoute.history.pushState, null, 'Root bar', '/baz/diff-id/root-bar');

        assert.calledTwice(v.Baz.onBaseEntry);

        assert.calledWith(Bart.setTitle, 'Root bar');
      },

      "test loadingArgs": function () {
        v.RootBar.onEntry = function () {
          v.loadingArgs = AppRoute.loadingArgs;

        };

        AppRoute.gotoPage(v.RootBar, {bazId: '123'});

        assert.equals(v.loadingArgs[0], v.RootBar);
        assert.equals(v.loadingArgs[1], {pathname: '/baz/123/root-bar', bazId: '123'});

        assert.same(AppRoute.loadingArgs, null);

      },

      "test path append on template": function () {
        v.RootBar.onEntry = function (page, pageRoute) {
          v.append = pageRoute.append;
        };

        AppRoute.gotoPath('/baz/123/root-bar/stuff/at/end');

        assert.same(v.append, 'stuff/at/end');
      },
    },

    "test append": function () {
      var RootBar = {
        name: 'RootBar',
        $autoRender: function () {
          return Bart.html('<div id="RootBar">x</div>');
        },
      };

      AppRoute.root.addTemplate(RootBar);
      AppRoute.gotoPage(RootBar, {append: "ap/this"});

      assert.calledWith(AppRoute.history.pushState, null, 'Piki', '/root-bar/ap/this');
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

    "test replacePath passes all args": function () {
      test.stub(AppRoute, 'gotoPath');

      AppRoute.replacePath(1, 2,3);

      assert.calledWith(AppRoute.gotoPath, 1, 2, 3);
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

    "test replacePage always changes history": function () {
      AppRoute.root.addTemplate(v.FooBar);
      AppRoute.gotoPath('/foo-bar');

      AppRoute.history.replaceState.reset();

      AppRoute.replacePath('/foo-bar');

      assert.called(AppRoute.history.replaceState);
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

      AppRoute.gotoPath({pathname: '/anything', search: '?abc=123&def=456'});

      assert.calledWith(v.FooBar.onEntry, v.FooBar, {pathname: '', search: '?abc=123&def=456'});

      AppRoute.gotoPage();
    },
  });
})();
