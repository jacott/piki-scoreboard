(function (test, v) {
  buster.testCase('packages/app-models/server/observer:', {
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
      v.TestSubClass.clearMemDocs();
      TH.destroyModel('TestSubClass');
      for(var i = 0; i < v.obs.length; ++i) {
        var row = v.obs[i];
        row.stop();
      }
      v = null;
    },

    "memory store": {
      setUp: function () {
        v.TestSubClass.observeOplog({
          upd: function (id, attrs) {
            if (v.expect)
              assert.same(v.TestSubClass.memFind('123').name, v.expect);

            if (attrs.name.match(/1/)) {
              if (attrs.name.match(/add/))
                v.TestSubClass.addMemDoc(id);
              else
                v.TestSubClass.delMemDoc(id);
            }
          }
        });

        v.TestSubClass.observeOplog({
          upd: function (id, attrs) {
            if (v.expect)
              assert.same(v.TestSubClass.memFind('123').name, v.expect);

            if (attrs.name.match(/2/)) {
              if (attrs.name.match(/add/))
                v.TestSubClass.addMemDoc(id);
              else
                v.TestSubClass.delMemDoc(id);
            }
          }
        });
      },

      tearDown: function () {
        v.TestSubClass.clearMemDocs();
      },


      "test mem and attrFind": function () {
        assert.same(v.TestSubClass.memFind(v.doc._id), undefined);
        assert.equals(v.TestSubClass.attrFind(v.doc._id), v.doc.attributes);
        assert.equals(v.TestSubClass.attrFind(v.doc._id, {transform: null, fields: {age: 1}}), {_id: v.doc._id, age: 5});

        v.TestSubClass.addMemDoc(v.doc.attributes);

        assert.same(v.TestSubClass.memFind(v.doc._id), v.doc.attributes);
        assert.same(v.TestSubClass.attrFind(v.doc._id, 'junk'), v.doc.attributes);
      },

      "test life cycle": function () {
        v.TestSubClass.addMemDoc(v.attrs = {_id: '123', name: 'bob'});
        v.TestSubClass.addMemDoc(v.attrs);
        assert.same(v.TestSubClass.memFind('123'), v.attrs);

        v.expect = 'bob';
        AppOplog.simulate('u', 'TestSubClass', '123', {name: 'rem 1'});
        assert.same(v.TestSubClass.memFind('123'), v.attrs);
        assert.same(v.attrs.name, 'rem 1');

        v.expect = 'rem 1';
        AppOplog.simulate('u', 'TestSubClass', '123', {name: 'add 1'});

        v.expect = 'add 1';


        AppOplog.simulate('u', 'TestSubClass', '123', {name: 'rem 2'});
        assert.same(v.TestSubClass.memFind('123'), v.attrs);

        v.expect = null;
        AppOplog.simulate('u', 'TestSubClass', '123', {name: 'rem 1'});
        assert.same(v.TestSubClass.memFind('123'), undefined);
      },

      "test update adds": function () {
        assert.equals(v.TestSubClass.memFind(v.doc._id), undefined);
        AppOplog.simulate('u', 'TestSubClass', v.doc._id, {name: 'add 1 2'});
        v.doc.attributes.name = 'add 1 2';
        assert.equals(v.TestSubClass.memFind(v.doc._id), v.doc.attributes);
        AppOplog.simulate('d', 'TestSubClass', v.doc._id);
        assert.equals(v.TestSubClass.memFind(v.doc._id), undefined);
      },
    },

    "test Observing ins": function () {
      v.TestSubClass.observeOplog({ins: v.stub = test.stub()});

      AppOplog.simulate('i', 'TestSubClass', 'junk', {_id: '123', name: 'bob'});

      assert.calledWith(v.stub, {_id: '123', name: 'bob'});

      refute(v.TestSubClass.memFind('123'));
    },

    "test simple upd": function () {
      v.TestSubClass.observeOplog({upd: v.stub = test.stub()});

      AppOplog.simulate('u', 'TestSubClass', '123', {name: 'bob'});

      assert.calledWith(v.stub, '123', {name: 'bob'});
    },

    "test subfield upd": function () {
      v.TestSubClass.observeOplog({upd: v.stub = test.stub()});
      v.TestSubClass.addMemDoc(v.doc.attributes);
      v.doc.$update({$push: {toys: 'bear'}});
      AppOplog.simulate('u', 'TestSubClass', v.doc._id, {"toys.1": 'bear'});

      assert.calledWith(v.stub, v.doc._id, {toys: ['robot', 'bear']});
    },

    "test del": function () {
      v.TestSubClass.observeOplog({del: v.stub = test.stub()});

      AppOplog.simulate('d', 'TestSubClass', '123');

      assert.calledWith(v.stub, '123');
    },
  });
})();
