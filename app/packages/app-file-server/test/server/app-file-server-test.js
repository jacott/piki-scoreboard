Meteor.isServer && (function (test, v) {
  var AppFS = Package['app-file-server'].AppFS;
  buster.testCase('packages/app-file-server/test/server/app-file-server:', {
    setUp: function () {
      test = this;
      v = {};
      v.declare = test.stub(AppFS._private.RoutePolicy,'declare');
      v.use = test.stub(AppFS._private.WebApp.connectHandlers,'use');
      v.connection = {use: v.use};
      v.use.returns(v.connection);
    },

    tearDown: function () {
      v = null;
    },

    "test AppFs.bodyParser": function (done) {
      AppFS.bodyParser('/root/postPath', function () {done()});

      assert.calledWith(v.declare, '/root/postPath', 'network');
      assert.calledWith(v.use, sinon.match(function (func) {
        return func.name === 'bodyParser';
      }));

      assert.calledWith(v.use, '/root/postPath', sinon.match(function (func) {
        func();
        return true;
      }));

    },

    "AppFS.handle": {
      "test exception caught": function (done) {
        var expRes = {writeHead: test.stub(), end: test.stub()};
        AppFS.handle('/rootPath', function (req, res, next) {
          test.stub(console, 'log', function () {
            assert.calledWith(expRes.writeHead, 503);
            assert.calledWith(expRes.end, '');
            done();
          });
          v.foo.bar();
        });

        assert.calledWith(v.use, '/rootPath', sinon.match(function (func) {
          v.func = func;
          return true;
        }));

        v.func('expReq', expRes, 'expNext');
      },

      "test passes args": function (done) {
        var expReq = 'expReq';
        var expRes = 'expRes';
        var expNext = 'expNext';
        AppFS.handle('/root/path', function (req, res, next) {
          assert.same(req, expReq);
          assert.same(res, expRes);
          assert.same(next, expNext);
          done();
        });

        assert.calledWith(v.declare, '/root/path', 'network');
        assert.calledWith(v.use, '/root/path', sinon.match(function (func) {
          v.func = func;
          return true;
        }));

        v.func(expReq, expRes, expNext);
      },
    },
  });
})();
