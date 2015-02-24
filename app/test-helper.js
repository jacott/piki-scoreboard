define(function(require, exports, module) {
  var koru = require('koru');
  var TH = require('koru/session/test-helper');
  var util = require('koru/util');
  var Model = require('koru/model');
  var Val = require('koru/model/validation');
  var session = require('koru/session');

  var geddon = TH.geddon;

  var user;

  TH.Factory = require('test/factory');

  var testCase = TH.testCase;
  var sendP, sendM;

  TH = util.reverseExtend({
    showErrors: function (doc) {
      return {
        toString: function () {
          return Val.inspectErrors(doc);
        },
      };
    },

    clearDB: function () {
      this.Factory.clear();
      for(var name in Model) {
        var model = Model[name];
        if ('docs' in model) {
          if (isClient) {
            model.docs = {};
            var indexes = model._indexUpdate.indexes;
            for(var id in indexes) {
              indexes[id].reload();
            }
          } else {
            model.docs.truncate();
            model._$wm = {};
          }
        }
      };
    },

    user: function () {
      return null;
    },

    userId: function () {
      return user && user._id;
    },

    mockRpc: function (sessId) {
      sessId = (sessId || "1").toString();
      if (isServer) {
        var ws = TH.mockWs();
        var conn;
        var id = 'koru/session/server-connection';
        conn = new (require(id)({}))(ws, sessId, geddon.test.stub());
        return function (method /*, args */) {
          conn.userId = koru.userId();
          return session._rpcs[method].apply(conn, util.slice(arguments, 1));
        };
      } else {
        return function (method /*, args */) {
          return session._rpcs[method].apply(util.thread, util.slice(arguments, 1));
        };
      }
    },

    login: function (func) {
      return this.loginAs(user || TH.Factory.last.user || TH.Factory.createUser('admin'), func);
    },

    loginAs: function (newUser, func) {
      var test = geddon.test;

      if (newUser !== user) {
        user && TH.user.restore();
        koru.userId.restore && koru.userId.restore();

        if (newUser) {
          test.stub(koru, 'userId', function () {return user._id});
          test.stub(TH,'user',function () {return user});
          var restore = TH.user.restore;
          TH.user.restore = function () {
            restore.call(TH.user);
            user = null;
            util.thread.userId = null;
          };

          user = newUser._id ? newUser : Model.User.findById(newUser);
          util.thread.userId = user && user._id;
        }
      }

      TH.setAccess && TH.setAccess();

      if (! func) return user;

      return func();
    },

  }, TH);

  if (isClient) {
    TH.MockFileReader = function (v) {
      function MockFileReader() {
        v.fileReaderargs = arguments;
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
    }
  });

  function overrideSub(name, sub, callback) {
    return true;
  }

  geddon.onEnd(function () {
    koru.setTimeout = koruSetTimeout;
    koru.clearTimeout = koruClearTimeout;
    koru.afTimeout = koruAfTimeout;
    if (sendP) {
      session.interceptSubscribe = null;
      session.sendP = sendP;
      sendP = null;
    }
    if (sendM) {
      session.sendM = sendM;
      sendM = null;
    }
  });

  var ga = geddon.assertions;

  ga.add('permitSpec', {
    assert: function (spec, changes, func, isNewRec) {
      var spy = geddon.sinon.spy(Val,'permitParams'),
          cSpec = this.cSpec = Val.permitSpec.apply(Val,spec);

      try {
        func.call();
        this.args = spy.getCall(0);

        return spy.calledWith(changes, cSpec, isNewRec);
      } finally {
        spy.restore();
      }
    },

    assertMessage: "Expected AppVal.permitSpec to be called like:\npermitParams({i1}, {i$cSpec})\nbut was called with:\n{$args}",
    refuteMessage: "Did not expect AppVal.permitSpec to be called like:\npermitParams({i1}, {i$cSpec})"
  });

  isServer && ga.add('modelUniqueIndex', {
    assert: function (model /*, arguments */) {
      var enIdx = model.addUniqueIndex,
          count = enIdx.callCount,
          tv = enIdx.thisValues,
          expected = util.slice(arguments, 1),
          result = false;

      for(var i=0;i < tv.length;++i) {
        if (tv[i] === model) {
          var call = enIdx.getCall(i);
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
