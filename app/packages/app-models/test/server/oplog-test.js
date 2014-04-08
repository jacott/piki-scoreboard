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
      test.stub(App, 'setTimeout').returns('toKey');
      test.stub(App, 'clearTimeout');
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
        var wfTimeout;
        assert.exception(function () {
          AppModel.beginWaitFor('TestSubClass', '123', function () {
            wfTimeout = Fiber.current._beginWaitFor.timeout;
            throw new Error("something went wrong");
          });
        });

        assert.equals(AppOplog._private.waitFors, {});

        assert.calledWith(App.clearTimeout, wfTimeout);
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
          AppModel.beginWaitFor('TestSubClass', '456', function (wf) {
            assert.same(wf, -1);

            v.insert('TestSubClass',  {_id: '456',   name: 'fred', age: 5});
            AppModel.endWaitFor(-1);

            // both lines above do not trigger;
            refute.equals(AppOplog._private.waitFors, {});

            v.insert('TestSubClass', {_id: '123', name: 'fred', age: 5});
            assert.equals(AppOplog._private.waitFors, {});
          });
        });
        assert.called(v.lastFuture.return);
      },

      "test endWaitFor": function () {
        var res = AppModel.beginWaitFor('TestSubClass', '123', function (wf) {
          AppModel.endWaitFor(-1);
          assert.same(Fiber.current._beginWaitFor, wf);
          refute.called(App.clearTimeout);
          AppModel.endWaitFor(wf);
          AppModel.endWaitFor(wf);
          assert.calledOnce(App.clearTimeout);
        });
      },

      "test beginWaitFor": function () {
        v.waitFunc = function () {
          refute.called(v.lastFuture.return);
          AppModel.endWaitFor(Fiber.current._beginWaitFor);
          v.ranWaitFunc = true;
        };
        var wfKey = AppOplog._private.wfKey;
        var res = AppModel.beginWaitFor('TestSubClass', '123', function (wf) {
          var keys = Fiber.current._beginWaitFor;
          assert.same(keys, wf);

          assert.same(keys.model, 'TestSubClass');
          assert.same(keys.id, '123');
          assert.same(keys.timeout, 'toKey');
          assert.same(keys.token, wfKey+1);

          assert.same(AppOplog._private.wfKey, wfKey+1);

          assert.same(App.getNestedHash(AppOplog._private.waitFors, 'TestSubClass', '123',
                                        wfKey+1), keys);

          return "success";
        });
        assert.same(res, "success");

        assert.isTrue(v.ranWaitFunc);

        assert.equals(AppOplog._private.waitFors, {});
        assert.same(Fiber.current._beginWaitFor, null);

        assert.calledOnce(v.lastFuture.return);
      },

      "test inserting": function () {
        assert.same(
          AppModel.beginWaitFor('TestSubClass', '123', function () {
            v.insert('TestSubClass',  {_id: '1',   name: 'fred', age: 5});
            v.insert('TestSubClassx', {_id: '123', name: 'fred', age: 5});
            assert(Fiber.current._beginWaitFor);

            refute.called(v.lastFuture.return);

            v.insert('TestSubClass', {_id: '123', name: 'fred', age: 5});
            assert.called(v.lastFuture.return);

            assert.equals(AppOplog._private.waitFors, {});
            return 'okay';
          }),
          "okay");
      },

      "test updating": function () {
        var future = AppModel.beginWaitFor('TestSubClass', '222', function () {
          v.update('TestSubClass',  '1',   {name: 'fred'});
          v.update('TestSubClassx', '222', {name: 'fred'});
          assert(Fiber.current._beginWaitFor);
          refute.called(v.lastFuture.return);

          v.update('TestSubClass', '222', {name: 'fred'});
          assert.called(v.lastFuture.return);
        });
      },

      "test removing": function () {
        var future = AppModel.beginWaitFor('TestSubClass', '222', function () {
          v.remove('TestSubClass',  '1');
          v.remove('TestSubClassx', '222');
          assert(Fiber.current._beginWaitFor);

          refute.called(v.lastFuture.return);

          v.remove('TestSubClass', '222');
          assert.called(v.lastFuture.return);
        });
      },
    },
  });
})();
