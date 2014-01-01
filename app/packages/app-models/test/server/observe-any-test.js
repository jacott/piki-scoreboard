(function (test, v) {
  buster.testCase('packages/app-models/test/server/observe-any:', {
    setUp: function () {
      test = this;
      TH.stubOplog();
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
      v = null;
    },

    "test insert no addedQuery": function () {
      v.obs.push(v.TestSubClass.observeAny({
        added: v.added = test.stub(),
      }));
      refute.called(v.added);
      AppOplog.simulate('i', 'TestSubClass', '123', {_id: '123', name: 'Bubba', age: 4});

      assert.calledWith(v.added, '123', {_id: '123', name: 'Bubba', age: 4});
    },

    "test insert with addedQuery": function () {
      v.obs.push(v.TestSubClass.observeAny({
        added: v.added = test.stub(),
        addedQuery: {},
      }));
      assert.calledWith(v.added, v.doc._id);
      AppOplog.simulate('i', 'TestSubClass', '123', {_id: '123', name: 'Bubba', age: 4});

      assert.calledWith(v.added, '123', {_id: '123', name: 'Bubba', age: 4});
    },

    "test update": function () {
      v.obs.push(v.TestSubClass.observeAny({
        changed: v.changed = test.stub(),
      }));
      AppOplog.simulate('u', 'TestSubClass', v.doc._id, {age: 5});
      assert.calledWith(v.changed, v.doc._id, {age: 5});
    },

    "test delete": function () {
      v.obs.push(v.TestSubClass.observeAny({
        removed: v.removed = test.stub(),
      }));

      AppOplog.simulate('d', 'TestSubClass', v.doc._id);
      assert.calledWith(v.removed, v.doc._id);
    },
  });
})();
