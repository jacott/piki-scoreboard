(function (test, v) {
  buster.testCase('packages/app-models/server/observe-field:', {
    setUp: function () {
      test = this;
      TH.stubOplog();
      v = {};
      v.TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'string', age: 'number', toys: 'has_many'});
      v.doc = v.TestSubClass.create({name: 'Fred', age: 5, toys: ['robot']});
      v.obs = [];
      v.TestSubClass.registerObserveField('age');
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

    "manipulation": {
      setUp: function () {
        v.doc2 =  v.TestSubClass.create({name: 'Bob', age: 35});
        v.obs.push(v.ids = v.TestSubClass.observeAge([5, 35], {
          added: v.added = test.stub(),
          removed: v.removed = test.stub(),
          changed: v.changed = test.stub(),
          stopped: v.stopped = test.stub(),
        }));

        assert.calledWith(v.added, v.doc._id, {_id: v.doc._id, name: 'Fred', age: 5, toys: ['robot']});
        assert.calledWith(v.added, v.doc2._id, v.doc2.attributes);

        v.doc3 = v.TestSubClass.create({name: 'Helen', age: 25});
        v.added.reset();
        v.removed.reset();
      },

      tearDown: function () {
        v.TestSubClass.clearMemDocs();
      },


      "test replaceValues": function () {
        v.ids.replaceValues([5, 25]);

        assert.calledWith(v.removed, v.doc2._id);
        assert.calledWith(v.added, v.doc3._id, v.doc3.attributes);

        v.ids.stop();

        assert.equals(AppOplog.observers(),{});

        assert.calledWith(v.stopped, 5);
        assert.calledWith(v.stopped, 35);
      },

      "test adding same does nothing": function () {
        v.ids.addValue(5);

        refute.called(v.added);
        refute.called(v.removed);
      },

      "test addValue": function () {
        v.ids.addValue(25);

        refute.called(v.removed);
        assert.calledWith(v.added, v.doc3._id, v.doc3.attributes);

        AppOplog.simulate('i', 'TestSubClass', '123', v.expected = {_id: '123', name: 'Mamma', age: 25});

        assert.calledWith(v.added, '123', v.expected);
      },

      "test removeValue": function () {
        v.TestSubClass.addMemDoc(v.doc2._id);
        v.ids.removeValue(5);

        refute.calledWith(v.removed, v.doc2._id);
        assert.calledWith(v.removed, v.doc._id);

        v.doc2.age = 5;
        v.doc2.$$save();

        AppOplog.simulate('u', 'TestSubClass', v.doc2._id, v.expected = {age: 5});

        assert.calledWith(v.changed, v.doc2._id, v.expected);
      },
    },


    "test insert": function () {
      v.obs.push(v.TestSubClass.observeAge([4, 6], {
        added: v.added = test.stub(),
      }));
      AppOplog.simulate('i', 'TestSubClass', '123', {_id: '123', name: 'Bubba', age: 3});
      refute.called(v.added);

      AppOplog.simulate('i', 'TestSubClass', '123', {_id: '123', name: 'Bubba', age: 4});

      assert.calledWith(v.added, '123', {_id: '123', name: 'Bubba', age: 4});
    },

    "test insert with condition": function () {
      var bubba = v.TestSubClass.create({name: 'Bubba', age: 5});
      v.obs.push(v.TestSubClass.observeAge([5], {
        added: v.added = test.stub(),
        addedQuery: {name: 'Bubba'}
      }));
      assert.calledOnceWith(v.added, bubba._id, bubba.attributes);
    },

    "update": {
      "test field known": function () {
        v.obs.push(v.TestSubClass.observeAge([4, 6], {
          changed: v.changed = test.stub(),
        }));
        AppOplog.simulate('u', 'TestSubClass', v.doc._id, {age: 7});
        refute.called(v.changed);

        AppOplog.simulate('u', 'TestSubClass', v.doc._id, {age: 6});

        assert.calledWith(v.changed, v.doc._id, {age: 6}, undefined);
      },

      "test field unknown": function () {
        v.obs.push(v.TestSubClass.observeAge([5, 6], {
          changed: v.changed = test.stub(),
        }));
        v.TestSubClass.docs.update(v.doc._id, {$push: {toys: 'cards'}});
        AppOplog.simulate('u', 'TestSubClass', v.doc._id, {"toys.1": 'cards'});

        assert.calledWith(v.changed, v.doc._id, {toys: ['robot', 'cards']}, 5);
      },

      "test passing single value": function () {
        v.obs.push(v.TestSubClass.observeAge(5, {
          changed: v.changed = test.stub(),
        }));
        AppOplog.simulate('u', 'TestSubClass', v.doc._id, {age: 5});

        assert.calledWith(v.changed, v.doc._id, {age: 5});
      },
    },

    "test delete anything": function () {
      v.obs.push(v.TestSubClass.observeAge([6], {
        removed: v.removed = test.stub(),
      }));

      AppOplog.simulate('d', 'TestSubClass', v.doc._id);

      assert.calledWith(v.removed, v.doc._id);
    },
  });
})();
