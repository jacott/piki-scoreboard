define(function(require, exports, module) {
  var env = require('koru/env');
  var TH = require('koru/test-helper');
  var util = require('koru/util');
  var Model = require('koru/model');

  var geddon = TH.geddon;

  var user;

  TH.Factory = require('../test/factory');

  util.extend(TH, {
    showErrors: function (doc) {
      return {
        toString: function () {
          return AppVal.inspectErrors(doc);
        },
      };
    },

    user: function () {
      return null;
    },

    userId: function () {
      return user && user._id;
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

      // if (typeof Bart !== 'undefined')
      //   Bart.Main.setAccess();

      if (! func) return user;

      return func();
    },

  });

  return TH;
});
