(function (test, v) {
  buster.testCase('packages/app-pages/test/client/bart-ext:', {
    setUp: function () {
      test = this;
      v = {};
      v.TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text', foo_ids: 'has-many'});
    },

    tearDown: function () {
      AppModel && TH.clearDB(); // remove old data (for AppModel building)
      TH.destroyModel('TestSubClass');
      v = null;
    },

    "test autoUpdate": function () {
      var foo = v.TestSubClass.create({foo_ids: [1]});
      test.spy(foo, '$reload');

      var obs = test.spy(v.TestSubClass.Index, 'observe');

      var ctx = {updateAllTags: test.stub(), onDestroy: test.stub(), data: foo};

      Bart.autoUpdate(ctx, {field: 'foo_ids'});

      assert.calledWith(ctx.onDestroy, obs.returnValues[0]);

      var foo2 = v.TestSubClass.create();

      obs.yield(App.reverseExtend({foo_ids: [1]}, foo2.attributes), foo2.attributes);

      refute.called(foo.$reload);
      refute.called(ctx.updateAllTags);

      foo.$change('foo_ids').push(2);
      foo.$$save();

      assert.called(foo.$reload);
      assert.called(ctx.updateAllTags);

      foo.$reload.reset();
      ctx.updateAllTags.reset();

      foo.name= 'new name';
      foo.$$save();

      assert.called(foo.$reload);
      assert.called(ctx.updateAllTags);
    },
  });
})();
