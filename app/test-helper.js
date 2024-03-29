define((require, exports, module) => {
  const koru            = require('koru');
  const localStorage    = require('koru/local-storage');
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const sessionTH       = require('koru/session/test-helper');
  const Stubber         = require('koru/test/stubber');
  const UserAccount     = require('koru/user-account');
  const util            = require('koru/util');
  const Factory         = require('test/factory');

  const {private$} = require('koru/symbols');
  const tx$ = Symbol();

  const {hasOwn} = util;

  let TH = Object.create(require('koru/model/test-db-helper'));

  let user = null;
  let txSave = null, txClient = null;

  let koruAfTimeout, koruSetTimeout, koruClearTimeout;
  let kst = 0;

  let sendBinary = null, _sendM = null;

  const runRpc = (self, method, args) => {
    const func = session._rpcs[method];
    if (typeof func !== 'function') {
      throw new Error(`"${method}" is not an rpc`);
    }
    return func.apply(self, args);
  };

  util.mergeOwnDescriptors(TH, sessionTH);
  util.merge(TH, {
    showErrors(doc) {return () => Val.inspectErrors(doc)},

    user() {return null},

    userId() {return user && user._id},

    mockRpc(v, sessId) {
      sessId = (sessId || '1').toString();
      if (isServer) {
        const ws = this.mockWs();
        let conn;
        if (v && v.conn) {
          conn = v.conn;
        } else {
          const id = 'koru/session/server-connection';
          conn = new (require(id))(session, ws, ws._upgradeReq, sessId, () => {});
          conn.dbId = 'sch00';
          if (v) v.conn = conn;
        }
        return TH.intercept(session, 'rpc', async (method, ...args) => {
          await conn.setUserId(koru.userId());
          const prevUserId = util.thread.userId;
          const prevConnection = util.thread.connection;
          try {
            util.thread.userId = conn.userId;
            util.thread.connection = conn;

            return runRpc(conn, method, args);
          } finally {
            util.thread.userId = prevUserId;
            util.thread.connection = prevConnection;
          }
        });
      } else {
        return TH.intercept(session, 'rpc', (method, ...args) => runRpc(util.thread, method, args));
      }
    },

    login() {
      return this.loginAs(user || Factory.last.user || Factory.createUser('admin'));
    },

    loginAs(newUser) {
      const {test} = TH;

      if (newUser !== user) {
        user != null && this.user.restore();
        koru.userId.restore && koru.userId.restore();

        if (typeof newUser === 'string') newUser = Model.User.findById(newUser);
        return ifPromise(newUser, (newUser) => {
          test.intercept(koru, 'userId', () => user._id);
          test.intercept(this, 'user', () => user, () => {
            user = null;
            util.thread.userId = null;
            koru.userId.restore && koru.userId.restore();
          });

          if (newUser !== undefined) {
            user = newUser;
            util.thread.userId = user?._id;
            this.setAccess?.();
            return newUser;
          }
        });
      }

      this.setAccess?.();

      return user;
    },

    matchModel(expect) {
      const func = this.match((actual) => actual != null && actual._id === expect._id);
      Object.defineProperty(func, 'message', {get() {return util.inspect(expect)}});

      return func;
    },

    matchItems(items) {
      const func = this.match((actual) => util.deepEqual(actual && actual.sort(), items && items.sort()));

      Object.defineProperty(func, 'message', {get() {
        return JSON.stringify(items);
      }});

      return func;
    },
  });

  if (isClient) {
    TH.MockFileReader = (v) => {
      function MockFileReader(...args) {
        v.fileReaderargs = args.slice();
        v.fileReader = this;
      }

      MockFileReader.prototype = {
        constructor: MockFileReader,

        readAsArrayBuffer(file) {
          this.result = this._str2ab(file.slice(0));
        },

        _result2Str(buf) {
          buf = buf || this.result;
          return String.fromCharCode.apply(null, new Uint8Array(buf));
        },

        _str2ab(str) {
          const buf = new ArrayBuffer(str.length);
          const bufView = new Uint8Array(buf);
          for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
          }
          return buf;
        },
      };

      return MockFileReader;
    };
  }

  TH.Core.onStart(async () => {
    koruAfTimeout = koru.afTimeout;
    koruSetTimeout = koru.setTimeout;
    koruClearTimeout = koru.clearTimeout;
    koru.setTimeout = () => {return ++kst};
    koru.afTimeout = () => () => {};
    koru.clearTimeout = () => {};
    if (isClient) {
      if (hasOwn(session, 'sendBinary')) {
        sendBinary = session.sendBinary;
        session.sendBinary = koru.nullFunc;
      }
      if (hasOwn(session, '_sendM')) {
        _sendM = session._sendM;
        session._sendM = koru.nullFunc;
      }
    }
  });

  TH.Core.onEnd(() => {
    koru.setTimeout = koruSetTimeout;
    koru.clearTimeout = koruClearTimeout;
    koru.afTimeout = koruAfTimeout;
    if (isClient) {
      if (sendBinary !== null) {
        sendBinary = null;
      }
      if (_sendM !== null) {
        session._sendM = _sendM;
        _sendM = null;
      }
    }
  });

  if (isServer) {
    UserAccount.sendResetPasswordEmail = async () => {};
  } else {
    const orgsStr = JSON.stringify({sch00: {name: 'Org 1'}, sch02: {name: 'Org 2'}});
    localStorage._resetValue = () => ({orgs: orgsStr, orgSN: 'SN1'});
  }

  const ga = TH.Core.assertions;

  ga.add('docChanges', {
    async assert(doc, spec, newSpec, func) {
      if (! func) {
        func = newSpec;
        newSpec = null;
      }
      var spy = Stubber.spy(Val, 'assertDocChanges');

      try {
        await func.call();
        this.args = spy.getCall(0);
        if (newSpec) {
          this.newSpec = ', ' + util.inspect(newSpec);
          return spy.calledWith(doc, spec, newSpec);
        }
        this.newSpec = '';
        return spy.calledWith(doc, spec);
      } finally {
        spy.restore();
      }
    },

    assertMessage: 'Expected Val.assertDocChanges to be called with:\n{i1}, {i0}{$newSpec}\n' +
      'but was called with:\n{$args}',
    refuteMessage: 'Did not expect Val.assertDocChanges to be called with:\n{i1}, {i0}{$newSpec}',
  });

  koru.onunload(module, 'reload');

  return TH;
});
