(function (test) {
  if (Meteor.isServer) return;
  buster.testCase('packages/app-models/test/client/app-observable:', {
    setUp: function () {
      test = this;
    },

    "test observing": function () {
      function ob1 () {
        test.ob1++;
      }
      function ob2() {
        test.ob2++;
      }

      var foo = {};
      test.ob1 = 0;
      test.ob2 = 0;
      AppObservable.attachTo(foo);

      refute(foo._autorun);

      foo.inform(ob1);
      foo._dep.changed();

      assert.same(test.ob1, 0);

      Deps.flush();

      assert.same(test.ob1, 1);

      foo.inform(ob2);

      foo._dep.changed();
      Deps.flush();

      assert.same(test.ob1, 2);
      assert.same(test.ob2, 1);

      foo.uninform(ob1);

      foo._dep.changed();
      Deps.flush();

      assert.same(test.ob1, 2);
      assert.same(test.ob2, 2);

      foo.uninform(ob1); // does nothing

      assert(foo._autorun);

      foo.uninform(ob2);

      foo._dep.changed();
      Deps.flush();

      assert.same(test.ob1, 2);
      assert.same(test.ob2, 2);

      refute(foo._autorun);
    },
  });
})();
