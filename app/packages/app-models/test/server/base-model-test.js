(function (test) {
  var match = sinon.match;

  var TestSubClass, doc, v;

  buster.testCase('packages/app-models/server/base-model:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.destroyModel('TestSubClass');
      v = null;
    },

    '$push $pull': {
      "test setup": function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass', {
          authorizePush: v.authorizePush = test.stub(),
          authorizePull: v.authorizePull = test.stub(),
        })
          .defineFields({foo_ids: 'has_many'});

        TestSubClass.pushPull('foo_ids');

        var sut = TestSubClass.create({foo_ids: [1,2]});

        TH.call('TestSubClass.push.foo_ids', sut._id, 3);

        assert.equals(sut.$reload().foo_ids, [1,2,3]);

        assert.calledWith(v.authorizePush, TH.userId(), 'foo_ids', 3, 'push');
        assert.same(v.authorizePush.thisValues[0]._id, sut._id);

        TH.call('TestSubClass.pull.foo_ids', sut._id, 3);

        assert.equals(sut.$reload().foo_ids, [1,2]);

        assert.calledWith(v.authorizePull, TH.userId(), 'foo_ids', 3, 'pull');
        assert.same(v.authorizePull.thisValues[0]._id, sut._id);
      },
    },

    "when calling bumpVersionRpc": {
      "test authorized": function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass',{authorizeVersionUpdate: function () {
          v.authorizeVersionUpdateCalled = true;
        }},{saveRpc: true})
          .defineFields({name: 'string'}).addVersioning();

        var tc = TestSubClass.create({name: 'foo'});

        TH.call("TestSubClass.bumpVersion", tc._id, 1);

        assert(v.authorizeVersionUpdateCalled);

        assert.same(tc.$reload()._version, 2);

        TH.call("TestSubClass.bumpVersion", tc._id, 1);
      },

    },

    'remote save': {

      "test requires authorize method": function () {
        var id = Random.id();

        TestSubClass = AppModel.Base.defineSubclass('TestSubClass',{},{saveRpc: true}).defineFields({name: 'string'});

        var func = Meteor.server.method_handlers['TestSubClass.save'];

        assert.isFunction(func);

        assert.accessDenied(function () {
          func.call({userId: 'user id'}, id,{name: 'a name'});
        });
      },

      'test authorized': function () {
        var id = Random.id();

        TestSubClass = AppModel.Base.defineSubclass('TestSubClass',{authorize: function () {}},
                                                    {saveRpc: true}).defineFields({name: 'string'});

        var func = Meteor.server.method_handlers['TestSubClass.save'];

        assert.isFunction(func);

        func.call({userId: 'user id'}, id,{name: 'a name'});

        var doc = AppModel.TestSubClass.findOne(id);
        assert(doc,'should have created a doc');
        assert.same(doc.name,'a name');
      },
    },
  });
})();
