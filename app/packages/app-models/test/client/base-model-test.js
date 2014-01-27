(function (test, v) {
  buster.testCase('packages/app-models/test/client/base-model:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppModel && TH.clearDB(); // remove old data (for AppModel building)
      TH.destroyModel('TestSubClass');
      v = null;
    },

    "test attrDocs": function () {
      var TestSubClass = AppModel.Base.defineSubclass('TestSubClass');

      assert.same(TestSubClass.docs._collection.docs, TestSubClass.attrDocs());
    },

    "test $remove": function () {
      var TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});

      TestSubClass.addRemoveRpc();

      TestSubClass.afterRemove(v.afterRemove = test.stub());

      var doc = TestSubClass.create({name: 'foo'});
      var spy = test.spy(Meteor,'call');

      doc.$remove();

      assert.calledWith(spy, 'TestSubClass.remove', doc._id);

      refute(TestSubClass.exists(doc._id));

      assert.called(v.afterRemove);
    },


    "test Index observer setup": function () {
      var TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});

      var t1 = TestSubClass.create({name: 'bar'});

      var count = 0;

      var otherStub = test.stub();
      var other = TestSubClass.Index.observe(otherStub);

      var key = TestSubClass.Index.observe(function (doc, old) {
        v.doc = doc;
        if (old) v.old = App.extend({},old);
        ++count;
      });

      var tc = TestSubClass.create({name: 'foo'});

      assert.same(count, 1);
      assert.equals(v.doc, tc.attributes);
      assert.isNull(v.old);

      var attrs = App.extend({}, v.doc);

      tc.$update({$set: {name: 'mary'}});

      assert.same(count, 2);
      assert.equals(v.doc, tc.$reload().attributes);
      assert.equals(v.old, attrs);

      t1.$remove();

      assert.same(count, 3);
      assert.equals(v.old, t1.attributes);
      assert.isNull(v.doc);

      key.stop();

      tc.$update({$set: {name: 'bob'}});
      assert.same(count, 3);
      assert.same(otherStub.callCount, 4);
    },

    '$push $pull': {
      "test setup": function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({foo_ids: 'has_many'});

        TestSubClass.pushPull('foo_ids');

        var sut = TestSubClass.create({foo_ids: [1,2]});

        TH.call('TestSubClass.push.foo_ids', sut._id, 3);

        assert.equals(sut.$reload().foo_ids, [1,2,3]);

        test.stub(Meteor, 'call');

        assert.same(sut.$push('foo_ids', 2), sut);

        assert.calledWith(Meteor.call, 'TestSubClass.push.foo_ids', sut._id, 2);

        TH.call('TestSubClass.pull.foo_ids', sut._id, 3);

        assert.equals(sut.$reload().foo_ids, [1,2,3]);

        Meteor.call.reset();

        assert.same(sut.$pull('foo_ids', 2), sut);

        assert.calledWith(Meteor.call, 'TestSubClass.pull.foo_ids', sut._id, 2);
      },
    },
  });
})();
