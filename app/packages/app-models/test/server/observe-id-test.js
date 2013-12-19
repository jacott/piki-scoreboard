(function (test, v) {
  buster.testCase('packages/app-models/server/observe-id:', {
    setUp: function () {
      test = this;
      v = {};
      v.TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'string', age: 'number', toys: 'has_many'});
      v.doc = v.TestSubClass.create({name: 'Fred', age: 5, toys: ['robot']});
      v.obs = [];
    },

    tearDown: function () {
      v.TestSubClass.docs.remove({});
      TH.destroyModel('TestSubClass');
      for(var i = 0; i < v.obs.length; ++i) {
        var row = v.obs[i];
        row.stop();
      }
      AppOplog.stopAllObservers();
      v = null;
    },

    "test observeIds": function () {
      var doc2 =  v.TestSubClass.create({name: 'Bob', age: 35});
      v.obs.push(v.ids = v.TestSubClass.observeIds([v.doc._id, doc2._id], {
        added: v.added = test.stub(),
        removed: v.removed = test.stub(),
        stopped: v.stopped = test.stub(),
      }));

      assert.calledWith(v.added, v.doc._id, {_id: v.doc._id, name: 'Fred', age: 5, toys: ['robot']});
      assert.calledWith(v.added, doc2._id, doc2.attributes);

      var doc3 = v.TestSubClass.create({name: 'Helen', age: 25});
      v.ids.replaceIds([v.doc._id, doc3._id]);

      assert.calledWith(v.removed, doc2._id);
      assert.calledWith(v.added, doc3._id, doc3.attributes);

      v.ids.stop();

      assert.equals(AppOplog.observers(),{});

      assert.calledWith(v.stopped, v.doc._id);
      assert.calledWith(v.stopped, doc2._id);
    },

    "test observeId added": function () {
       v.obs.push(v.TestSubClass.observeId(v.doc._id, {
        added: v.added = test.stub()
      }));

      assert.calledWith(v.added, v.doc._id, {_id: v.doc._id, name: 'Fred', age: 5, toys: ['robot']});
    },

    "test observeId changed": function (done) {
      var count = 2;
      for(var i = 0; i < 2; ++i) {
        v.obs.push(v.TestSubClass.observeId(v.doc._id, {
          changed: done.wrap(function (id, attrs) {
            assert.same(id, v.doc._id);
            assert.equals(attrs, {age: 17});
            if (--count === 0) done();
          })
        }));
      }
      v.doc.age = 17;
      v.doc.$$save();
    },

    "test nested change": function (done) {
      v.obs.push(v.TestSubClass.observeId(v.doc._id, {
        changed: done.wrap(function (id, attrs) {
          assert.same(id, v.doc._id);
          assert.equals(attrs, {toys: ['robot', 'cards']});
          done();
        })
      }));

      v.TestSubClass.docs.update(v.doc._id, {$push: {toys: 'cards'}});
    },

    "test observeId removed": function (done) {
      var count = 2;
      for(var i = 0; i < 2; ++i) {
        v.obs.push(v.TestSubClass.observeId(v.doc._id, {
          removed: done.wrap(function (id) {
            assert.same(id, v.doc._id);
            if (--count === 0) done();
          })
        }));
      }
      v.doc.$remove();
    },
  });
})();
