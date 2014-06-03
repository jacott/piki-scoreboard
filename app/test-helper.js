define(function(require, exports, module) {
  var env = require('koru/env');
  var TH = require('koru/test-helper');
  var util = require('koru/util');
  var Model = require('koru/model');
  var Val = require('koru/model/validation');
  var session = require('koru/session');

  var geddon = TH.geddon;

  var user;

  TH.Factory = require('test/factory');

  var testCase = TH.testCase;
  var sendP;

  util.extend(TH, {
    testCase: function () {
      var tc = testCase.apply(TH, arguments);
      tc.onStartTestCase(stubSendP);
      tc.onEndTestCase(unstubSendP);
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

    login: function (func) {
      return this.loginAs(user || TH.Factory.last.user || TH.Factory.createUser(), func);
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
            env.userId.restore && env.userId.restore();
            restore.call(TH.user);
            user = null;
          };

          user = newUser._id ? newUser : Model.User.findById(newUser);
        }
      }

      TH.setAccess && TH.setAccess();

      if (! func) return user;

      return func();
    },

  });

  function stubSendP() {
    if (session.hasOwnProperty('sendP')) {
      sendP = session.sendP;
      session.sendP = env.nullFunc;
    }
  }

  function unstubSendP() {
    if (sendP) {
      session.sendP = sendP;
      sendP = null;
    }
  }

  return TH;
});
