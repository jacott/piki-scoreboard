(function (test, v) {
  buster.testCase('lib/client/bart-ext/each:', {
    setUp: function () {
      test = this;
      v = {};
      _BartTest_ext_each_test(Bart);
      v.Each = Bart.Test.Ext.Each;

      v.Each.$helpers({
        fooList: v.fooList = test.stub().returns({stop: v.stop = test.stub()}),
      });
    },

    tearDown: function () {
      delete Bart.Test;
      v = null;
    },

    "test callback.render": function () {
      test.onEnd(function () {
        AppModel && TH.clearDB(); // remove old data (for AppModel building)
        TH.destroyModel('TestSubClass');
      });

      var TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({
        id1: 'text',
        id2: 'text',
        name: 'text',
        score: 'number',
      });
      var index = TestSubClass.Index.addUniqueIndex('id1', 'id2', 'name');

      v.Each.$helpers({
        fooList: function (callback) {
          return callback.render({
            model: TestSubClass,
            index: index,
            params: {id1: Bart.current.data().major, id2: '2'},
            sort: Apputil.compareByName,
          });
        }
      });

      var doc1 = TestSubClass.create({id1: '1', id2: '2', name: 'bob'});
      var doc2 = TestSubClass.create({id1: '1', id2: '2', name: 'alice'});
      var other = TestSubClass.create({id1: '2', id2: '3', name: 'henry'});

      assert.dom(v.Each.$render({major: '1'}), function () {
        assert.dom('li', {count: 2});
        assert.dom('li:first-child', 'alice');
        assert.dom('li:nth-child(2)', 'bob');

        TestSubClass.create({id1: '1', id2: '2', name: 'barny'});
        assert.dom('li', {count: 3});
        assert.dom('li:nth-child(2)', 'barny');

        doc1.$update({$set: {name: 'aalan'}});
        assert.dom('li', {count: 3});
        assert.dom('li:nth-child(1)', 'aalan');

        doc1.$update({$set: {id2: '3'}});
        assert.dom('li', {count: 2});
        refute.dom('li', 'aalan');

        doc1.$update({$set: {id2: '2'}});
        assert.dom('li', {count: 3});
        assert.dom('li', 'aalan');

        other.$update({$set: {id2: '2'}});
        assert.dom('li', {count: 3});
      });
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

    "test works with removeInserts": function () {
      assert.dom(v.Each.$render({}), function () {
        var callback = v.fooList.args[0][0];

        callback({id: 1, name: 'r1'});
        callback({id: 2, name: 'r2'});

        assert.dom('li', {text: 'r1', parent: function () {
          var start = this.firstChild.nextSibling;
          Bart.removeInserts(start);
          assert.same(start.nextSibling, start._bartEnd);
          assert.same(start._bartEnd.nodeType, document.COMMENT_NODE);
        }});
        refute.dom('li');
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
