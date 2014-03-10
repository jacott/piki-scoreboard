(function (test, v) {
  buster.testCase('packages/app-models/test/app:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      delete AppModel.TModel;
    },

    'test extend': function () {
      var item = 5,
          sub={a: 1, b: 2},
          sup = {b: 3, get c() {return item;}};

      App.extend(sub,sup);

      item = 6;

      assert.same(sub.a,1);
      assert.same(sub.b,3);
      assert.same(sub.c,6);

    },

    'test reverseExtend': function () {
      var item = 5,
          sub={a: 1, b: 2},
          sup = {d: 'd', b: 3, get c() {return item;}};

      App.reverseExtend(sub,sup, {d: 1});

      item = 6;

      assert.same(sub.a,1);
      assert.same(sub.b,2);
      assert.same(sub.c,6);
      refute('d' in sub);
    },

    "test withDateNow": function () {
      var date = new Date("2013-06-09T23:10:36.855Z");
      var result = App.withDateNow(date, function () {
        assert.equals(App.newDate(), date);
        assert.equals(App.dateNow(), +date);
        assert.same(App.withDateNow(+date + 123, function () {
          assert.equals(App.newDate(), new Date(+date + 123));
          assert.equals(App.dateNow(), +date + 123);

          if (Meteor.isServer) {
            var Fiber = Npm.require('fibers');
            assert.same(App.thread, Fiber.current.appThread);
          }
          assert.equals(App.thread, {dates: [undefined, 1370819436855], date: 1370819436978});
          return 987;
        }), 987);

        assert.equals(App.newDate(), date);
        assert.equals(App.dateNow(), +date);
        return true;
      });

      var before = App.dateNow();
      var now = Date.now();
      var after = App.dateNow();

      assert.between(now, before, after);

      assert.isTrue(result);
    },

    "test timeWarp": function () {
      assert.same(App.timeWarp(), 0);
      App.timeWarp(-1234567);
      assert.same(App.timeWarp(), -1234567);
      var before = Date.now();
      var between = App.dateNow();
      var between2 = App.newDate();
      var after = Date.now();

      assert.between(between, before-1234567, after-1234567);
      assert.isFunction(between2.getDate);
      assert.between(+between2, before-1234567, after-1234567);

      App.timeWarp(0);
      assert.same(App.timeWarp(), 0);
      var before = Date.now();
      var between = App.dateNow();
      var between2 = App.newDate();
      var after = Date.now();

      assert.between(between, before, after);
      assert.isFunction(between2.getDate);
      assert.between(+between2, before, after);
    },

    "test userId": function () {
      TH.login(function () {
        assert.same(App.userId(), TH.userId());
      });
    },


    'test module': function () {
      var result = App.module('a.few.levels', function (mod,name) {
        assert.same(this,mod);
        mod.attr = 123;
      });

      assert.same(result,App.a.few.levels);

      App.module('a.few.other', function (mod) {
        assert.same(this,mod);
        mod.thing = 'test';
      });

      assert.same(App.a.few.levels.attr,123);
      assert.same(App.a.few.other.thing,'test');
    },

    'test module direct loading': function () {
      var result = App.module('foo.bar', { bar: 123});

      assert.same(App.foo.bar.bar, 123);
    },

    'with loaded/require': {
      tearDown: function () {
        App.unload('test/abc');
        App.unload('test/xyz');
      },


      'test delayed call only dependants': function () {
        var self = this,
            arg = {},
            reqee = self.stub(),
            reqee2 = self.stub();

        App.require('test/abc', reqee);

        refute.calledWithExactly(reqee, arg);

        App.require('test/abc', reqee2);
        App.loaded('test/xyz');

        refute.called(reqee);

        App.loaded('test/abc', arg);

        assert.calledOnce(reqee);
        assert.calledOnce(reqee2);

        assert.same(reqee.thisValues[0], arg);
        assert.same(reqee2.thisValues[0], arg);
      },

      'test calls after loaded': function () {
        var self = this,
            count = 0,
            arg = {a: 123};

        function reqee(arg1) {
          assert.same(this, arg);
          assert.same(arg1, arg);
          ++count;
        };

        App.loaded('test/abc', arg);
        App.require('test/abc', reqee);

        assert.same(count, 1);
      },

      'test unload': function () {
        var reqee = this.stub();

        App.loaded('test/abc','test');
        App.unload('test/abc');

        App.require('test/abc', reqee);

        refute.called(reqee);

        App.loaded('test/abc');

        assert.calledOnce(reqee);

        assert.same(reqee.thisValues[0],App);
      },

      // test multiple files in require('a/b', 'c/d', func);
      // store unix-open-file style count with func [count, func] to record when requirements met.
    },

  });
})();
