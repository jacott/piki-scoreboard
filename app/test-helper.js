define(function(require, exports, module) {
  var env = require('koru/env');
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
    testCase: function () {
      var tc = testCase.apply(TH, arguments);
      tc.onStartTestCase(tcStart);
      tc.onEndTestCase(tcEnd);
      return tc;
    },

    showErrors: function (doc) {
      return {
        toString: function () {
          return Val.inspectErrors(doc);
        },
      };
    },

    clearDB: function () {
      TH.Factory.clear();
      for(var name in Model) {
        var model = Model[name];
        if ('docs' in model) {
          if (isClient)
            Model[name].docs = {};
          else {
            Model[name].docs.remove({});
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
          conn.userId = env.userId();
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
        env.userId.restore && env.userId.restore();

        if (newUser) {
          test.stub(env, 'userId', function () {return user._id});
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

  function tcStart() {
    if (session.hasOwnProperty('sendP')) {
      sendP = session.sendP;
      session.sendP = env.nullFunc;
    }
    if (session.hasOwnProperty('sendM')) {
      sendM = session.sendM;
      session.sendM = env.nullFunc;
    }
  }

  function tcEnd() {
    if (sendP) {
      session.sendP = sendP;
      sendP = null;
    }
    if (sendM) {
      session.sendM = sendM;
      sendM = null;
    }
  }

  return TH;
});
