(function (test, v) {
  buster.testCase('lib/client/bart-ext/each:', {
    setUp: function () {
      test = this;
      v = {};
      _BartTest_ext_each_test(Bart);
      v.Each = Bart.Test.Ext.Each;

      v.Each.$helpers({
        fooList: v.fooList = test.stub(),
      });
    },

    tearDown: function () {
      delete Bart.Test;
      v = null;
    },

    "test simple adding and deleting": function () {
      assert.dom(v.Each.$render({}), function () {
        refute.dom('li');
        assert.calledOnceWith(v.fooList, sinon.match.func);

        v.fooList.yield({id: 1, name: 'r1'});
        assert.dom('li', 'r1');

        v.fooList.yield({_id: 2, name: 'r2'});
        assert.dom('li+li', 'r2');

        Bart.getCtx(this).updateAllTags();
        assert.dom('li+li', 'r2');

        v.fooList.yield({id: 2, name: 'r3'});
        assert.dom('li', {count: 2});
        assert.dom('li+li', 'r3');

        assert.dom('li', 'r1', function () {
          Bart.getCtx(this).onDestroy(v.destroy = test.stub());
        });

        v.fooList.yield(null, {id: 1});
        refute.dom('li', 'r1');
        assert.dom('li', {count: 1});
        assert.called(v.destroy);

        // ensure removed from lookup list
        v.fooList.yield({id: 1, name: 'r1'});
        assert.dom('li', 'r1');
      });
    },

    "test ordered": function () {
      assert.dom(v.Each.$render({}), function () {
        var callback = v.fooList.args[0][0];

        function sort(a, b) {
          return a.order - b.order;
        }

        callback({id: 1, name: 'r1', order: 3}, null, sort);
        assert.dom('li', 'r1');

        callback({_id: 2, name: 'r2', order: 1}, null, sort);
        assert.dom('li+li', 'r1');


        callback({id: 2, name: 'r2', order: 4}, null, sort);
        assert.dom('li+li', 'r2');
        assert.dom('li', {count: 2});

        callback({id: 2, name: 'r2', order: -1}, null, sort);
        assert.dom('li+li', 'r1');
        assert.dom('li', {count: 2});

        // ensure only reinserts if order changes
        callback({id: 1, name: 'r4', order: 1}, {id: 1, name: 'r1', order: 1}, sort);
        assert.dom('li+li', 'r4');
        callback({id: 1, name: 'r4', order: -2}, {id: 1, name: 'r4', order: 1}, sort);
        assert.dom('li+li', 'r2');
      });
    },
  });
})();
