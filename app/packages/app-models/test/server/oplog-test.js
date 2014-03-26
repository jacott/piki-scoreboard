(function (test, v) {
  var Fiber = Npm.require('fibers');
  var Future = Npm.require('fibers/future');

  buster.testCase('packages/app-models/test/server/oplog:', {
    setUp: function () {
      test = this;
      v = {};
      v.coll = new Meteor.Collection('TestSubClass');
      v.future = new Future;
      v.timeout = setTimeout(function () {
        v.future.throw('Timed out');
      }, 500);
      v.beginWaitFor = AppModel.beginWaitFor;
      v.oplog_timeout = AppOplog.timeout;
      AppOplog.timeout = 2000;
      AppModel.beginWaitFor = AppModel._origBeginWaitFor;
    },

    tearDown: function () {
      AppOplog.stopAllObservers();
      AppModel.beginWaitFor = v.beginWaitFor;
      AppOplog.timeout = v.oplog_timeout;
      clearTimeout(v.timeout);
      v.coll.remove({});
      TH.destroyModel('TestSubClass');
      v = null;
    },

    "test observing insert": function () {
      var callbacks = {
        ins: function (attrs) {
          v.future.return(attrs);
        },
      };
      AppOplog.observe('TestSubClass', {ins: v.canceled = test.stub()}).stop();
      v.handler = AppOplog.observe('TestSubClass', callbacks);

      v.coll.insert(v.expected = {_id: '123', name: 'fred', age: 5});

      var attrs = v.future.wait();

      assert.equals(attrs, v.expected);

      refute.called(v.canceled);

      v.handler.stop();

      assert.equals(AppOplog.observers(),{});
    },

    "test observing update": function () {
      var callbacks = {
        upd: function () {
          v.future.return(arguments);
        },
      };
      v.handler = AppOplog.observe('TestSubClass', callbacks);

      v.coll.insert({_id: '123', name: 'fred', age: 5});

      v.coll.update({_id: '123'}, {$set: {age: 17}});

      var attrs = v.future.wait();

      assert.equals(attrs, ['123', {age: 17}]);
    },

    "test observing delete": function () {
      var callbacks = {
        del: function (id) {
          v.future.return(id);
        },
      };
      v.handler = AppOplog.observe('TestSubClass', callbacks);

      v.coll.insert({_id: '123', name: 'fred', age: 5});

      v.coll.remove({});

      var attrs = v.future.wait();

      assert.equals(attrs, '123');
    },

    "oplog waiting": {
      setUp: function () {
        var prefix;

        v._processEntry = function (collName, result) {
          prefix = prefix || new Array(AppOplog._private.collNameIndex+1).join('x');
          result.ns = prefix + collName;
          AppOplog._private.processEntry({op: result});
        },

        v.insert = function (collName, attrs) {
          v._processEntry(collName, {op: 'i', o: attrs});
        };

        v.update = function (collName, id, attrs) {
          v._processEntry(collName, {op: 'u', o2: {_id: id}, o: attrs});
        };

        v.remove = function (collName, id) {
          v._processEntry(collName, {op: 'd', o: {_id: id}});
        };

        v.origFuture = AppOplog._private.replaceFuture(MyFuture);

        v.waitFunc = test.stub();

        function MyFuture() {
          v.lastFuture = this;
          this.return = test.stub();
          this.wait = v.waitFunc;
        }
      },

      tearDown: function () {
        AppOplog._private.resetFuture();
        AppOplog._private.replaceFuture(v.origFuture);
      },

      "test exception when wrapped": function () {
        assert.exception(function () {
          AppModel.beginWaitFor('TestSubClass', '123', function () {
            throw new Error("something went wrong");
          });
        });

        assert.equals(AppOplog._private.wait, [null, null]);
        assert.called(v.lastFuture.return);
      },

      "test observe before future return": function () {
        v.handler = AppOplog.observe('TestSubClass', {ins: v.stub = test.stub()});
        var future = AppModel.beginWaitFor('TestSubClass', '123', function () {
          assert(v.lastFuture);
          v.insert('TestSubClass', {_id: '123', name: 'fred', age: 5});
          assert.called(v.lastFuture.return);
        });
        assert(v.stub.calledBefore(v.lastFuture.return), "called in wrong order");
      },

      "test ignores subsequent calls": function () {
        AppModel.beginWaitFor('TestSubClass', '123', function () {
          AppModel.beginWaitFor('TestSubClass', '456', function () {
            v.insert('TestSubClass',  {_id: '456',   name: 'fred', age: 5});
            assert.equals(AppOplog._private.wait, ['TestSubClass', '123']);
            v.insert('TestSubClass', {_id: '123', name: 'fred', age: 5});
            assert.equals(AppOplog._private.wait, [-1, null]);
          });
        });
        assert.called(v.lastFuture.return);
      },

      "test beginWaitFor": function () {
        v.waitFunc = function () {
          refute.called(v.lastFuture.return);
          AppModel.endWaitFor('TestSubClass', '123');
          v.ranWaitFunc = true;
        };
        var res = AppModel.beginWaitFor('TestSubClass', '123', function () {
          assert.equals(AppOplog._private.wait, ['TestSubClass', '123']);
          return "success";
        });
        assert.same(res, "success");

        assert.isTrue(v.ranWaitFunc);

        assert.equals(AppOplog._private.wait, [null, null]);
        assert.calledOnce(v.lastFuture.return);
      },

      "test inserting": function () {
        assert.same(
          AppModel.beginWaitFor('TestSubClass', '123', function () {
            v.insert('TestSubClass',  {_id: '1',   name: 'fred', age: 5});
            v.insert('TestSubClassx', {_id: '123', name: 'fred', age: 5});
            assert.equals(AppOplog._private.wait, ['TestSubClass', '123']);

            refute.called(v.lastFuture.return);

            v.insert('TestSubClass', {_id: '123', name: 'fred', age: 5});
            assert.called(v.lastFuture.return);

            assert.equals(AppOplog._private.wait, [-1, null]);
            return 'okay';
          }),
          "okay");
      },

      "test updating": function () {
        var future = AppModel.beginWaitFor('TestSubClass', '222', function () {
          v.update('TestSubClass',  '1',   {name: 'fred'});
          v.update('TestSubClassx', '222', {name: 'fred'});
          assert.equals(AppOplog._private.wait, ['TestSubClass', '222']);

          refute.called(v.lastFuture.return);

          v.update('TestSubClass', '222', {name: 'fred'});
          assert.called(v.lastFuture.return);
        });
      },

      "test removing": function () {
        var future = AppModel.beginWaitFor('TestSubClass', '222', function () {
          v.remove('TestSubClass',  '1');
          v.remove('TestSubClassx', '222');
          assert.equals(AppOplog._private.wait, ['TestSubClass', '222']);

          refute.called(v.lastFuture.return);

          v.remove('TestSubClass', '222');
          assert.called(v.lastFuture.return);
        });
      },
    },
  });
})();
