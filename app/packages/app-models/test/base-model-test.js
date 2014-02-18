(function (test) {
  var match = sinon.match;

  var TestSubClass, doc, v;

  buster.testCase('packages/app-models/test/base-model:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      AppModel && TH.clearDB(); // remove old data (for AppModel building)
      TH.destroyModel('TestSubClass');
      v = null;
    },

    'with model lock': {
      setUp: function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});
      },

      "test nesting": function () {
         try {
          TestSubClass.lock("a", function () {
            try {
              TestSubClass.lock("a", function () {
                assert.isTrue(TestSubClass.isLocked("a"));
                throw new Error("catch me");
              });
            } catch(ex) {
              assert.isTrue(TestSubClass.isLocked("a"));
              throw ex;
            }
            geddon.fail("should not reach here");
          });
        } catch (ex) {
          v.ex = ex;
        }
        assert.same(v.ex.message, "catch me");

        assert.isFalse(TestSubClass.isLocked("a"));
      },

      "test Exception unlocks": function () {
        try {
          TestSubClass.lock("a", function () {
            assert.isTrue(TestSubClass.isLocked("a"));
            throw new Error("catch me");
          });
        } catch (ex) {
          assert.same(ex.message, "catch me");
        }

        assert.isFalse(TestSubClass.isLocked("a"));
      },

      "test isLocked": function () {
        TestSubClass.lock("a", function () {
          v.isLocked_a = TestSubClass.isLocked("a");
          v.isLocked_b = TestSubClass.isLocked("b");
        });

        assert.isTrue(v.isLocked_a);
        assert.isFalse(v.isLocked_b);
        assert.isFalse(TestSubClass.isLocked("a"));
      },
    },

    'with observering': {
      setUp: function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});
        v.tc = TestSubClass.create({name: 'foo'});

        TestSubClass.afterCreate(v.afterCreate = test.stub());
        TestSubClass.afterUpdate(v.afterUpdate = test.stub());
        TestSubClass.afterSave(v.afterSave = test.stub());
        TestSubClass.beforeCreate(v.beforeCreate = test.stub());
        TestSubClass.beforeUpdate(v.beforeUpdate = test.stub());
        TestSubClass.beforeSave(v.beforeSave = test.stub());
        TestSubClass.afterRemove(v.afterRemove = test.stub());
      },

      "test remove calls": function () {
         v.afterRemove.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          v.afterRemoveId = doc._id;
        }));

        v.tc.$remove();

        assert.calledOnce(v.afterRemove);
        assert.same(v.tc._id, v.afterRemoveId);
      },

      "test update calls": function () {
        v.beforeSave.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'bar'});
          v.beforeSaveId = doc._id;
        }));

        v.afterSave.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'bar'});
          v.afterSaveId = doc._id;
        }));

        v.beforeUpdate.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'bar'});
          v.beforeUpdateId = doc._id;
        }));

        v.afterUpdate.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'bar'});
          v.afterUpdateId = doc._id;
        }));

        v.tc.name = 'bar';
        v.tc.$save();

        assert.calledOnce(v.beforeUpdate);
        assert.same(v.tc._id, v.beforeUpdateId);

        assert.calledOnce(v.afterUpdate);
        assert(v.tc._id, v.afterUpdateId);

        assert.calledOnce(v.beforeSave);
        assert.same(v.tc._id, v.beforeSaveId);

        assert.calledOnce(v.afterSave);
        assert(v.tc._id, v.afterSaveId);

        refute.called(v.afterCreate);
        refute.called(v.beforeCreate);
      },

      "test create calls": function () {
        v.beforeSave.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'foo', _id: doc._id});
          v.beforeSaveId = doc._id;
        }));

        v.afterSave.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'foo', _id: doc._id});
          v.afterSaveId = doc._id;
        }));

        v.beforeCreate.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'foo', _id: doc._id});
          v.beforeCreateId = doc._id;
        }));

        v.afterCreate.withArgs(sinon.match(function (doc) {
          assert.equals(doc.attributes, {name: 'foo', _id: doc._id});
          assert.equals(doc.changes, {name: 'foo', _id: doc._id});
          v.afterCreateId = doc._id;
        }));

        v.tc = TestSubClass.create({name: 'foo'});
        assert.calledOnce(v.beforeCreate);
        assert.same(v.tc._id, v.beforeCreateId);

        assert.calledOnce(v.afterCreate);
        assert(v.tc._id, v.afterCreateId);

        assert.calledOnce(v.beforeSave);
        assert.same(v.tc._id, v.beforeSaveId);

        assert.calledOnce(v.afterSave);
        assert(v.tc._id, v.afterSaveId);

        refute.called(v.afterUpdate);
        refute.called(v.beforeUpdate);
      },
    },

    'with versioning': {
      setUp: function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});
      },

      "test no _version": function () {
        var tc = TestSubClass.create({name: 'foo'});

        assert.same(tc._version, undefined);
      },

      "test updating": function () {
        TestSubClass.addVersioning();

        var tc = TestSubClass.create({name: 'foo'});

        assert.same(tc._version, 1);

        tc.name = 'bar';
        tc.$save();

        assert.same(tc.$reload()._version, 2);
      },

      "test bumping": function () {
        TestSubClass.addVersioning();

        var tc = TestSubClass.create({name: 'foo'});

        tc.$bumpVersion();
        tc.$bumpVersion();

        assert.same(tc.$reload()._version, 2);

        tc.$bumpVersion();
        assert.same(tc.$reload()._version, 3);
      },
    },

    "test ref cache": function () {
      TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});
      var foo = TestSubClass.create();

      foo.$cacheRef('bin')["123"] = 5;

      assert.same(foo.$cacheRef('bin')["123"], 5);

      assert.same(foo.$reload().$cacheRef('bin')["123"], undefined);

    },

    "test cache": function () {
      TestSubClass = AppModel.Base.defineSubclass('TestSubClass').defineFields({name: 'text'});
      var foo = TestSubClass.create();

      foo.$cache.boo = 5;

      assert.same(foo.$cache.boo, 5);

      assert.same(foo.$reload().$cache.boo, undefined);
    },

    'test change recording': function () {
      TestSubClass = AppModel.Base.defineSubclass('TestSubClass').
        defineFields({
          name: 'text',
          other: 'number'
        });

      var testAttrs = {_id: 123, name: 'orig name'};
      var tsc = new TestSubClass(testAttrs);

      tsc.name = 'orig name';
      assert.equals(tsc.changes,{});

      tsc.name = 'new name';
      assert.equals(tsc.changes,{name: 'new name'});

      tsc.name = 'another';
      assert.equals(tsc.changes,{name: 'another'});

      tsc.other = 'new other';
      assert.equals(tsc.changes,{name: 'another', other: 'new other'});

      tsc.name = 'orig name';
      assert.equals(tsc.changes,{other: 'new other'});

      assert.same(tsc.attributes,testAttrs);
    },

    'test remove': function () {
      TestSubClass = AppModel.Base.defineSubclass('TestSubClass', {}, {saveRpc: true});
      var sut = AppModel.TestSubClass.create();

      sut.$remove();

      assert.same(AppModel.TestSubClass.find().count(),0);
    },

    'with TestSubClass': {
      setUp: function () {
        TestSubClass = AppModel.Base.defineSubclass('TestSubClass', {t1: 123, authorize: function () {}}, {saveRpc: true});
      },

      "test validator passing function": function () {
        TestSubClass.defineFields({foo: {type: 'text', required: function (field, options) {
          assert.same(this, doc);
          assert.same(field, 'foo');
          assert.same(options.type, 'text');
          return v.answer;
        }}});

        var doc = TestSubClass.build({foo: ''});

        v.answer = false;
        assert(doc.$isValid());

        v.answer = true;
        refute(doc.$isValid());
      },

      "test change": function () {
        TestSubClass.defineFields({foo: {type: 'has_many'}});

        var doc = TestSubClass.create({foo: {bar: {baz: 'orig'}}});

        doc.$change('foo').bar.baz = "new";

        var bar = doc.foo.bar;

        assert.equals(doc.changes, {foo: {bar: {baz: 'new'}}});
        assert.equals(doc.attributes.foo, {bar: {baz: 'orig'}});

        doc.$change('foo').fnord = 123;
        doc.$change('foo').bar.boo = "me too";


        assert.equals(bar, {baz: 'new', boo: "me too"});

        assert.equals(doc.changes, {foo: {bar: {baz: 'new', boo: "me too"}, fnord: 123}});
        assert.equals(doc.attributes.foo, {bar: {baz: 'orig'}});
      },

      "test definePrototype": function () {
        TestSubClass.definePrototype('fooBar', fooBar);

        var baz = {_id: "123"};
        var called;

        var sut = TestSubClass.create();
        TH.login(function () {
          sut.fooBar(baz, "abc");
        });

        assert.isTrue(called);

        function fooBar(id, baz_id, qux) {
          assert.same(id, sut._id);

          assert.same(baz_id, "123");
          assert.same(qux, "abc");
          assert.same(this.userId, TH.userId());
          called = true;
        }
      },

      "test update shortCut": function () {
        var doc = TestSubClass.create({name: 'testing'});

        doc.$update({$set: {name: 'changed'}});

        assert.same(doc.$reload().attributes.name, 'changed');
      },

      "test can override and save invalid doc": function () {
        TestSubClass.defineFields({bar: {type: 'text', required: true}});
        var foo = TestSubClass.build();

        foo.$save('force');

        assert(TestSubClass.exists(foo._id));
      },

      "test must be valid save ": function () {
        TestSubClass.defineFields({bar: {type: 'text', required: true}});
        var foo = TestSubClass.build();

        assert.invalidRequest(function () {
          foo.$$save();
        });

        foo.bar = 'okay';
        foo.$$save();

        assert.same(foo.$reload().bar, 'okay');
      },

      'test findIds': function () {
        TestSubClass.defineFields({foo: 'text'});
        var exp_ids = [1,2,3].map(function (num) {
          return TestSubClass.docs.insert({foo: num});
        });

        assert.equals(TestSubClass.findIds().sort(), exp_ids.slice(0).sort());
        assert.equals(TestSubClass.findIds({foo: {$gt: 1}}).sort(), exp_ids.slice(1,4).sort());
        assert.equals(TestSubClass.findIds(null, {sort: {foo: -1}}), exp_ids.slice(0).reverse());
      },

      'test timestamps': function () {
        TestSubClass.defineFields({name: 'text', createdAt: 'timestamp', updatedAt: 'timestamp',});

        assert.equals(TestSubClass.createTimestamps, { createdAt: true });
        assert.equals(TestSubClass.updateTimestamps, { updatedAt: true });

        var start = Date.now();

        var doc = TestSubClass.create({name: 'testing'});

        assert(doc._id);

        assert.between(+doc.createdAt, start, Date.now());

        var oldCreatedAt = new Date(start - 1000);

        TestSubClass.docs.update(doc._id, {$set: {createdAt: oldCreatedAt, updatedAt: oldCreatedAt}});

        doc.$reload();

        start = Date.now();

        doc.name = 'changed';
        doc.$save();

        doc.$reload();

        assert.same(+doc.createdAt, +oldCreatedAt);
        refute.same(+doc.updatedAt, +oldCreatedAt);
        assert.between(+doc.updatedAt, start, Date.now());
      },

      "test belongs_to auto": function () {
        test.onEnd(function () {delete AppModel.Foo});
        var findStub = test.stub();
        findStub.withArgs("abc").returns({name: "qux"});
        AppModel.Foo = {findOne: findStub};
        TestSubClass.defineFields({foo_id: {type: 'belongs_to'}});

        var sut = TestSubClass.build({foo_id: "abc"});

        assert.same(sut.foo.name, "qux");
        assert.same(sut.foo.name, "qux");

        assert.calledOnce(findStub);
      },

      "test belongs_to manual": function () {
        test.onEnd(function () {delete AppModel.Foo});
        var findStub = test.stub();
        findStub.withArgs("abc").returns({name: "qux"});
        AppModel.Foo = {findOne: findStub};
        TestSubClass.defineFields({baz_id: {type: 'belongs_to', modelName: 'Foo'}});

        var sut = TestSubClass.build({baz_id: "abc"});

        assert.same(sut.baz.name, "qux");
      },

      "test hasMany": function () {
        var find = test.stub();

        find.returns("fail")
          .withArgs({$and: ["foreign_ref", "param"]}, {sort: 1}).returns("two args")
          .withArgs("foreign_ref", {transform: null}).returns("options only")
          .withArgs("foreign_ref").returns("no args");

        function fooFinder() {
          assert.same(this, sut);
          return "foreign_ref";
        }


        // exercise
        TestSubClass.hasMany('foos', {find: find}, fooFinder);

        var sut = new TestSubClass();

        assert.same(sut.foos(), "no args");
        assert.same(sut.foos("param" ,{sort: 1}), "two args");
        assert.same(sut.foos({}, {transform: null}), "options only");
        assert.same(sut.foos(null, {transform: null}), "options only");
      },

      'test user_id_on_create': function () {
        TestSubClass.defineFields({name: 'text', user_id: 'user_id_on_create'});

        assert.equals(TestSubClass.userIds, { user_id: 'create' });

        TH.login(this, function () {
          var doc = TestSubClass.create({name: 'testing'});

          assert(doc._id);

          if (Meteor.isServer) {
            // save doesn't have a userId
            assert.same(doc.user_id, undefined);
            // but the saveRpc does
            var id;
            Meteor.call('TestSubClass.save', id = Random.id(), {name: 'testing'} );
            assert.same(TestSubClass.findOne(id).user_id, TH.userId());
          } else {
            assert.same(doc.user_id, TH.userId());
          }
        });
      },

      'test equality': function () {
        var OtherClass = AppModel.Base.defineSubclass('OtherClass'),
            a = new TestSubClass(),
            b = new TestSubClass(),
            c = new OtherClass();

        refute.isTrue(a.$equals(b));

        a.attributes._id = "hello";

        refute.isTrue(a.$equals(b));

        b.attributes._id = a._id;
        c.attributes._id = a._id;

        assert.isTrue(a.$equals(b));
        refute.isTrue(a.$equals(c));
        refute.isTrue(a.$equals(null));
      },

      'test create': function () {
        this.spy(AppModel.TestSubClass.docs,'insert');
        var attrs = {name: 'testing'};

        this.spy(Meteor,'call');
        doc = TestSubClass.create(attrs);
        refute.same(doc.changes,doc.attributes);
        assert.equals(doc.changes,{});

        attrs._id = doc._id;
        assert.calledOnceWith(AppModel.TestSubClass.docs.insert,attrs);
        if(Meteor.isClient)
          assert.calledOnceWith(Meteor.call,'TestSubClass.save', doc._id,{_id: doc._id, name: "testing"});
        else
          refute.called(Meteor.call);

      },

      'test update': function () {
        TestSubClass.defineFields({name: 'string'});
        doc = TestSubClass.create({name: 'old'});

        this.spy(AppModel.TestSubClass.docs,'update');
        this.spy(Meteor,'call');

        doc.name = 'new';
        doc.$save();

        doc.$reload();
        assert.same(doc.name, 'new');
        assert.equals(doc.changes,{});

        assert.calledOnceWith(AppModel.TestSubClass.docs.update,doc._id,{$set: {name: 'new'}});
        if(Meteor.isClient)
          assert.calledOnceWith(Meteor.call,'TestSubClass.save', doc._id,{name: "new"});
        else
          refute.called(Meteor.call);
      },

      'test afterCreate callback': function () {
        var afterCreateStub = this.stub();
        AppModel.TestSubClass.afterCreate(afterCreateStub);

        var attrs = {name: 'testing'};

        doc = TestSubClass.create(attrs);


        refute.same(doc.changes,doc.attributes);
        refute.same(doc.changes,attrs);

        attrs._id = doc._id;
        assert.calledOnce(afterCreateStub);

        assert.equals(afterCreateStub.getCall(0).args[0].attributes,doc.attributes);

        doc.name = 'new';
        doc.$save();

        assert.calledOnce(afterCreateStub);
      },


      'test build': function () {
        doc = TestSubClass.create();
        var copy = AppModel.TestSubClass.build(doc.attributes);

        refute.same(doc.attributes, copy.changes);
        assert.same(doc.name, copy.name);

        assert.same(copy._id,undefined);
        assert.same(copy.changes._id, undefined);
      },

      'test setFields': function () {
        AppModel.TestSubClass.defineFields({a: 'text', d: 'text', notme: 'text'});
        var sut = new AppModel.TestSubClass();


        var result = sut.$setFields(['a','d','notdefined','_id'],{a: 'aa',d: 'dd', notdefined: 'set', notme: 'nm', '_id': 'noset'});

        assert.same(result,sut);

        assert.equals(sut.changes,{a: 'aa',d: 'dd'});

        assert.same(sut.notdefined,'set');

      },

    },

    'test defineSubclass': function () {
      var TestSubClass = AppModel.Base.defineSubclass('TestSubClass', {t1: 123});

      var testAttrs = {_id: 123, name: 'orig name'};
      var tsc = new TestSubClass(testAttrs);

      assert.same(tsc.constructor, TestSubClass);
      assert.same(tsc.attributes, testAttrs);
      assert.same(tsc.t1, 123);

      TestSubClass.defineFields({
        name: 'text',
        level: 'not used yet',
        withDef: {type: 'text', default: 0},
      });

      tsc = new TestSubClass({name: 'abc'});

      assert.same(tsc.name, 'abc');

      assert.same(tsc.withDef, 0);

      tsc.name = 'john';
      tsc.attributes.level = 4;
      tsc.withDef = 'set';

      assert.same(tsc.level,4);
      assert.same(tsc.withDef,'set');

      tsc.withDef = null;
      assert.same(tsc.withDef,null);

      tsc.withDef = undefined;
      assert.same(tsc.withDef, 0);
    }
  });
})();
