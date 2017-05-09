define(function(require, exports, module) {
  'use strict';
  const koru         = require('koru');
  const localStorage = require('koru/local-storage');
  const Model        = require('koru/model');
  const dbBroker     = require('koru/model/db-broker');
  const Val          = require('koru/model/validation');
  const session      = require('koru/session');
  const sessionTH    = require('koru/session/test-helper');
  const Stubber      = require('koru/test/stubber');
  const util         = require('koru/util');

  let TH = Object.create(require('koru/test-helper'));
  const {geddon} = TH;

  let user = null;
  let txSave = null, txClient = null;

  TH.Factory = require('test/factory');

  koru.onunload(module, 'reload');

  util.mergeOwnDescriptors(TH, sessionTH);
  util.merge(TH, {
    showErrors (doc) {return () => Val.inspectErrors(doc)},

    clearDB: isClient ? () => {
      TH.Factory.clear();
      const models = Model._databases.default;
      for(const name in models) {
        const model = Model[name];
        model.docs = undefined;
      }
    } : () => {
      TH.Factory.clear();
      for(const name in Model) {
        const model = Model[name];
        if ('docs' in model) {
          txSave || model.docs.truncate();
          model._$docCacheClear();
        }
      }
    },

    user () {return null;},

    userId () {return user && user._id;},

    mockRpc (v, sessId) {
      sessId = (sessId || "1").toString();
      if (isServer) {
        const ws = this.mockWs();
        let conn;
        const id = 'koru/session/server-connection-factory';
        if (v && v.conn)
          conn = v.conn;
        else {
          conn = new (require(id)({globalDict: session.globalDict}))(ws, sessId, () => {});
          conn.dbId = 'sch00';
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

    login(func) {
      return this.loginAs(user || this.Factory.last.user || this.Factory.createUser('admin'), func);
    },

    loginAs(newUser, func) {
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

    matchModel(expect) {
      var func = this.match(function (actual) {
        return actual._id === expect._id;
      });

      Object.defineProperty(func, 'message', {get() {
        return util.inspect(expect);
      }});

      return func;
    },

    matchItems(items) {
      var func = this.match(function (actual) {
        return util.deepEqual(actual && actual.sort(), items && items.sort());
      });

      Object.defineProperty(func, 'message', {get() {
        return JSON.stringify(items);
      }});

      return func;
    },

    startTransaction() {
      if (isClient) return;
      util.forEach(arguments, db => {
        db._getConn();
        var tx = db._weakMap.get(util.thread);
        transactionMap.set(db, tx);
        tx.transaction = 'ROLLBACK';
        db.query('BEGIN');
        dbBroker.db = db;
      });
    },

    rollbackTransaction() {
      if (isClient) return;
      util.forEach(arguments, db => {
        var tx = transactionMap.get(db);
        if (! tx) return;
        dbBroker.db = null;
        tx.transaction = null;
        db.query('ROLLBACK');
        db._releaseConn();
      });
      dbBroker.db = null;
    },

  });

  if (isClient) {
    TH.MockFileReader = function (v) {
      function MockFileReader(...args) {
        v.fileReaderargs = args.slice();
        v.fileReader = this;
      };

      MockFileReader.prototype = {
        constructor: MockFileReader,

        readAsArrayBuffer(file) {
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

  let sendP, sendM;


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
      if (session.hasOwnProperty('_sendM')) {
        sendM = session._sendM;
        session._sendM = koru.nullFunc;
      }
    } else {
      txClient = dbBroker.db;
      txClient._getConn();
      txSave = txClient._weakMap.get(util.thread);
      txSave.transaction = 'ROLLBACK';
    }
  });

  geddon.onEnd(() => {
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
        session._sendM = sendM;
        sendM = null;
      }
    }
  });

  if (isServer) {
    geddon.onTestStart(() => {
      dbBroker.db = txClient;
      txSave && txClient.query('BEGIN');
    });

    geddon.onTestEnd(() => {txSave && txClient.query('ROLLBACK')});
  } else {
    var orgsStr = JSON.stringify({sch00: {name: 'Org 1'}, sch02: {name: 'Org 2'}});
    localStorage._resetValue = () => ({orgs: orgsStr});
  }

  function overrideSub(name, sub, callback) {
    callback && callback();
    return true;
  }

  var ga = geddon.assertions;

  ga.add('docChanges', {
    assert(doc, spec, newSpec, func) {
      if (! func) {
        func = newSpec;
        newSpec = null;
      }
      var spy = Stubber.spy(Val,'assertDocChanges');

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

    assertMessage: "Expected Val.assertDocChanges to be called with:\n{i1}, {i0}{$newSpec}\n"+
      "but was called with:\n{$args}",
    refuteMessage: "Did not expect Val.assertDocChanges to be called with:\n{i1}, {i0}{$newSpec}"
  });

  module.exports = TH;
});
