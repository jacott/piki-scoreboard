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

    "test default template": function () {
      v.Each.nodes[0].children[1].pop();

      Bart.newTemplate({
        name: "Test.Ext.Each.Each_fooList",
        nodes: [{
          name:"li",
          attrs:[["=","id",["", "id"]]],
          children: [["","name"]],
        }],
      });

      assert.dom(v.Each.$render({}), function () {
        v.fooList.yield({id: "id1", name: 'r1'});
        assert.dom('li#id1', 'r1');
      });
    },

    "callback.render": {
      setUp: function () {
        v.TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({
          id1: 'text',
          id2: 'text',
          name: 'text',
          score: 'number',
        });
        v.index = v.TestSubClass.Index.addUniqueIndex('id1', 'id2', 'name');

        v.doc1 = v.TestSubClass.create({id1: '1', id2: '2', name: 'bob'});
        v.doc2 = v.TestSubClass.create({id1: '1', id2: '2', name: 'alice'});
        v.other = v.TestSubClass.create({id1: '2', id2: '3', name: 'Caprice'});
      },

      tearDown: function () {
        AppModel && TH.clearDB(); // remove old data (for AppModel building)
        TH.destroyModel('TestSubClass');
      },

      "test params and index": function () {
        v.Each.$helpers({
          fooList: function (callback) {
            return callback.render({
              model: v.TestSubClass,
              index: v.index,
              params: {id1: Bart.current.data().major, id2: '2'},
              sort: Apputil.compareByName,
            });
          }
        });

        assert.dom(v.Each.$render({major: '1'}), function () {
          assert.dom('li', {count: 2});
          assert.dom('li:first-child', 'alice');
          assert.dom('li:nth-child(2)', 'bob');

          v.TestSubClass.create({id1: '1', id2: '2', name: 'barny'});
          assert.dom('li', {count: 3});
          assert.dom('li:nth-child(2)', 'barny');

          v.doc1.$update({$set: {name: 'aalan'}});
          assert.dom('li', {count: 3});
          assert.dom('li:nth-child(1)', 'aalan');

          v.doc1.$update({$set: {id2: '3'}});
          assert.dom('li', {count: 2});
          refute.dom('li', 'aalan');

          v.doc1.$update({$set: {id2: '2'}});
          assert.dom('li', {count: 3});
          assert.dom('li', 'aalan');

          v.other.$update({$set: {id2: '2'}});
          assert.dom('li', {count: 3});
        });
      },

      "test filter and model": function () {
         v.Each.$helpers({
          fooList: function (callback) {
            return callback.render({
              model: v.TestSubClass,
              params: {id1: Bart.current.data().major, id2: '2'},
              filter: function (doc) {
                return doc.name.match(/ice/);
              },
            });
          }
        });

        assert.dom(v.Each.$render({major: '1'}), function () {
          assert.dom('li', {count: 1});
          assert.dom('li', 'alice');

          v.TestSubClass.create({id1: '1', id2: '2', name: 'Rick'});
          assert.dom('li', {count: 1});
          assert.dom('li', 'alice');


          v.TestSubClass.create({id1: '1', id2: '2', name: 'Patrice'});
          assert.dom('li', {count: 2});
          assert.dom('li:last-child', 'Patrice');

          v.doc1.$update({$set: {name: 'Maurice'}});
          assert.dom('li', {count: 3});
          assert.dom('li:last-child', 'Maurice');

          v.doc1.$update({$set: {id2: '3'}});
          assert.dom('li', {count: 2});
          refute.dom('li', 'Maurice');

          v.doc1.$update({$set: {id2: '2'}});
          assert.dom('li', {count: 3});
          assert.dom('li', 'Maurice');

          v.other.$update({$set: {id2: '2'}});
          assert.dom('li', {count: 3});
        });
      },
    },

    "test sets parentCtx": function () {
      assert.dom(v.Each.$render({}), function () {
        var eachCtx = Bart.getCtx(this);
        v.fooList.yield({id: 1, name: 'r1'});
        assert.dom('li', function () {
          assert.same(Bart.getCtx(this).parentCtx, eachCtx);
        });
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
