(function (test, v) {
  var Fiber = Npm.require('fibers');
  var Future = Npm.require('fibers/future');

  buster.testCase('packages/app-models/server/oplog:', {
    setUp: function () {
      test = this;
      v = {};
      v.coll = new Meteor.Collection('TestSubClass');
      v.future = new Future;
      v.timeout = setTimeout(function () {
        v.future.throw('Timed out');
      }, 500);
    },

    tearDown: function () {
      AppOplog.stopAllObservers();
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
  });
})();
