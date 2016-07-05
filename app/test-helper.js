define(function(require, exports, module) {
  'use strict';
  const koru    = require('koru');
  const Model   = require('koru/model');
  const Val     = require('koru/model/validation');
  const session = require('koru/session');
  const stubber = require('koru/test/stubber');
  const util    = require('koru/util');
  const User    = require('models/user');

  var   TH      = require('koru/session/test-helper');
  const geddon = TH.geddon;

  var user;

  TH.Factory = require('test/factory');

  koru.onunload(module, 'reload');

  TH = util.reverseExtend({
    showErrors: function (doc) {
      return function () {
        return Val.inspectErrors(doc);
      };
    },

    clearDB: isClient ? function () {
      TH.Factory.clear();
      let dbv = Model._databases.default;
      for(var name in dbv) {
        var model = Model[name];
        model.docs = null;
      }
    } : function () {
      TH.Factory.clear();
      for(var name in Model) {
        var model = Model[name];
        if ('docs' in model) {
          txSave || model.docs.truncate();
          model._$docCacheClear();
        }
      }
    },

    user: function () {
      return null;
    },

    userId: function () {
      return user && user._id;
    },

    mockRpc: function (v, sessId) {
      sessId = (sessId || "1").toString();
      if (isServer) {
        var ws = this.mockWs();
        var conn;
        var id = 'koru/session/server-connection';
        if (v && v.conn)
          conn = v.conn;
        else {
          conn = new (require(id)({globalDict: session.globalDict}))(ws, sessId, function () {});
          if (v) v.conn = conn;
        }
        return geddon.test.intercept(session, 'rpc', function (method, ...args) {
          conn.userId = koru.userId();
          try {
            var prevUserId = util.thread.userId;
            var prevConnection = util.thread.connection;
            util.thread.userId = conn.userId;
            util.thread.connection = conn;

            if (! session._rpcs[method]) throw new Error('RPC: "' + method + '" is undefined');
            return session._rpcs[method].apply(conn, args);
          } finally {
            util.thread.userId = prevUserId;
            util.thread.connection = prevConnection;
          }
        });
      } else {
        return geddon.test.intercept(session, 'rpc', function (method, ...args) {
          return session._rpcs[method].apply(util.thread, args);
        });
      }
    },

    login: function (func) {
      return this.loginAs(user || this.Factory.last.user || this.Factory.createUser('admin'), func);
    },

    loginAs: function (newUser, func) {
      var test = geddon.test;
      var self = this;

      if (newUser !== user) {
        user && self.user.restore();
        koru.userId.restore && koru.userId.restore();

        if (newUser) {
          test.intercept(koru, 'userId', function () {return user._id});
          test.intercept(self, 'user', function () {return user}, function () {
            user = null;
            util.thread.userId = null;
            koru.userId.restore && koru.userId.restore();
          });

          user = newUser._id ? newUser : Model.User.findById(newUser);
          util.thread.userId = user && user._id;
        }
      }

      self.setAccess && self.setAccess();

      if (! func) return user;

      try {
        return func();
      } finally {
        self.user && self.user.restore && self.user.restore();
      }
    },

    matchModel: function (expect) {
      var func = this.match(function (actual) {
        return actual && actual._id === expect._id;
      });

      Object.defineProperty(func, 'message', {get: function () {
        return util.inspect(expect);
      }});

      return func;
    },

    matchItems: function (items) {
      var func = this.match(function (actual) {
        return util.deepEqual(actual && actual.sort(), items && items.sort());
      });

      Object.defineProperty(func, 'message', {get: function () {
        return JSON.stringify(items);
      }});

      return func;
    },

    makeResponse: function (v) {
      v.output = [];
      return {
        writeHead: geddon.test.stub(),
        write: function (data) {
          refute(v.ended);
          v.output.push(data);
        },
        end: function (data) {
          v.output.push(data);
          v.ended = true;
        }
      };
    },

    startTransaction: function () {
      if (isClient) return;
      util.forEach(arguments, db => {
        db._getConn();
        var tx = db._weakMap.get(util.thread);
        transactionMap.set(db, tx);
        tx.transaction = 'ROLLBACK';
        db.query('BEGIN');
        util.thread.db = db;
      });
    },

    rollbackTransaction: function () {
      if (isClient) return;
      util.forEach(arguments, db => {
        var tx = transactionMap.get(db);
        if (! tx) return;
        util.thread.db = null;
        tx.transaction = null;
        db.query('ROLLBACK');
        db._releaseConn();
      });
      util.thread.db = null;
    },

  }, TH);

  if (isClient) {
    TH.MockFileReader = function (v) {
      function MockFileReader(...args) {
        v.fileReaderargs = args.slice();
        v.fileReader = this;
      };

      MockFileReader.prototype = {
        constructor: MockFileReader,

        readAsArrayBuffer: function (file) {
          this.result = this._str2ab(file.slice(0));
        },

        _result2Str: function(buf) {
          buf = buf || this.result;
          return String.fromCharCode.apply(null, new Uint8Array(buf));
        },

        _str2ab: function(str) {
          var buf = new ArrayBuffer(str.length);
          var bufView = new Uint8Array(buf);
          for (var i=0, strLen=str.length; i<strLen; i++) {
            bufView[i] = str.charCodeAt(i);
          }
          return buf;
        },
      };

      return MockFileReader;
    };
  } else {
    var transactionMap = new WeakMap;
  }

  var koruAfTimeout, koruSetTimeout, koruClearTimeout;
  var kst = 0;

  var sendP, sendM;


  geddon.onStart(function () {
    koruAfTimeout = koru.afTimeout;
    koruSetTimeout = koru.setTimeout;
    koruClearTimeout = koru.clearTimeout;
    koru.setTimeout = function() { return ++kst};
    koru.afTimeout = function() { return function () {}};
    koru.clearTimeout = function() {};
    if (isClient) {
      if (session.hasOwnProperty('sendP')) {
        sendP = session.sendP;
        session.sendP = koru.nullFunc;
        session.interceptSubscribe = overrideSub; // don't queue subscribes
      }
      if (session.hasOwnProperty('sendM')) {
        sendM = session.sendM;
        session.sendM = koru.nullFunc;
      }
    } else {
      txClient = User.db;
      txClient._getConn();
      txSave = txClient._weakMap.get(util.thread);
      txSave.transaction = 'ROLLBACK';
    }
  });

  geddon.onEnd(function () {
    if (isServer && txSave) {
      txSave.transaction = null;
      txSave = null;
      txClient._releaseConn();
    }

    koru.setTimeout = koruSetTimeout;
    koru.clearTimeout = koruClearTimeout;
    koru.afTimeout = koruAfTimeout;
    if (isClient) {
      if (sendP) {
        session.interceptSubscribe = null;
        session.sendP = sendP;
        sendP = null;
      }
      if (sendM) {
        session.sendM = sendM;
        sendM = null;
      }
    }
  });

  var txSave, txClient;

  if (isServer) {
    geddon.onTestStart(function () {
      util.thread.db = txClient;
      txSave && txClient.query('BEGIN');
    });

    geddon.onTestEnd(function () {
      txSave && txClient.query('ROLLBACK');
    });

  }

  function overrideSub(name, sub, callback) {
    return true;
  }

  var ga = geddon.assertions;

  ga.add('docChanges', {
    assert: function (doc, spec, newSpec, func) {
      if (! func) {
        func = newSpec;
        newSpec = null;
      }
      var spy = stubber.spy(Val,'assertDocChanges');

      try {
        func.call();
        this.args = spy.getCall(0);
        if (newSpec) {
          this.newSpec = ", "+ util.inspect(newSpec);
          return spy.calledWith(doc, spec, newSpec);
        }
        this.newSpec = '';
        return spy.calledWith(doc, spec);
      } finally {
        spy.restore();
      }
    },

    assertMessage: "Expected Val.assertDocChanges to be called with:\n{i1}, {i0}{$newSpec}\nbut was called with:\n{$args}",
    refuteMessage: "Did not expect Val.assertDocChanges to be called with:\n{i1}, {i0}{$newSpec}"
  });

  isServer && ga.add('modelUniqueIndex', {
    assert: function (model, ...expected) {
      var enIdx = model.addUniqueIndex,
          count = enIdx.callCount,
          tvLength = enIdx.callCount,
          result = false;

      for(var i=0;i < tvLength;++i) {
        var call = enIdx.getCall(i);
        if (call.thisValue === model) {
          if (call.calledWith.apply(call,expected)) {
            result = true;
            break;
          }
        }
      }

      if (this._asserting !== result) {
        this.expected = expected;
        this.spy = enIdx.printf("%n");
        this.calls = enIdx.printf("%C");
      }

      return result;
    },

    message: "{$spy} to be calledWith {i$expected}{$calls}"
  });

  return TH;
});
