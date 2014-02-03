(function (test, v) {
  buster.testCase('packages/app-models/test/client/base-model-observer:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppModel && TH.clearDB(); // remove old data (for AppModel building)
      TH.destroyModel('TestSubClass');
      v = null;
    },

    "addUniqueIndex": {
      setUp: function () {
        v.TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({
          id1: 'text',
          id2: 'text',
        });
      },

      "test adding": function () {
        var idx = v.TestSubClass.Index.addUniqueIndex('id2', 'id1');

        var doc1 = v.TestSubClass.create({id1: '3', id2: '4'});
        var doc2 = v.TestSubClass.create({id1: '2', id2: '2'});
        var doc3 = v.TestSubClass.create({id1: '1', id2: '4'});

        assert.same(idx({id1: '3', id2: '4'}), doc1._id);

        assert.equals(idx({id2: '4'}), {'1': doc3._id, '3': doc1._id});
      },

      "test changing": function () {
        var idx = v.TestSubClass.Index.addUniqueIndex('id2', 'id1');

        var doc1 = v.TestSubClass.create({id1: '3', id2: '4'});
        var doc2 = v.TestSubClass.create({id1: '2', id2: '2'});
        var doc3 = v.TestSubClass.create({id1: '1', id2: '4'});

        doc1.$update({$set: {id1: '4'}});

        assert.same(idx({id1: '4', id2: '4'}), doc1._id);
        assert.same(idx({id1: '3', id2: '4'}), undefined);

        doc2.$update({$set: {id2: '4'}});

        assert.equals(idx({}), {'4': {'4': doc1._id, '2': doc2._id, '1': doc3._id}});

      },
    },
  });
})();
