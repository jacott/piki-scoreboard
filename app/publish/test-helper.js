define(function(require, exports, module) {
  const koru        = require('koru');
  const Val         = require('koru/model/validation');
  const session     = require('koru/session');
  const message     = require('koru/session/message');
  const UserAccount = require('koru/user-account');
  const util        = require('koru/util');
  const Model       = require('model');

  const TH = Object.create(require('test-helper'));

  util.merge(TH, {
    mockClientSub () {
      const sub = {
        match: TH.stub(),
        onStop (func) {
          TH.onEnd(func);
        },
      };

      TH.spy(sub, 'onStop');
      return sub;
    },

    stubMatchers (sub, names) {
      var matchers = {};
      names.split(' ').forEach(function (name) {
        matchers[name] = sub.match.withArgs(name, TH.match.func);
      });
      return matchers;
    },

    assertMatchersCalled (matchers) {
      var funcs = {};
      for (var key in matchers) {
        var match = matchers[key];
        assert.calledOnce(match);
        funcs[key] = match.args(0, 1);
      }
      return funcs;
    },

    mockSession () {
      return {globalDict: message.newGlobalDict()};
    },

    stubVerifyToken (token) {
      token = (token || 'ulid|ultoken').split('|');
      TH.stub(UserAccount, 'verifyToken').withArgs(...token).returns({userId: TH.userId()});
    },

    mockSubscribe (v, id, name, ...args) {
      if (! v.conn) {
        v.conn = this.mockConnection(null, v.session);
        v.send = v.conn.ws.send;
      }
      var pub = session._commands.P;
      pub.call(v.conn, [id, name, args]);

      return v.conn._subs[id];
    },

    cleanUpTest (v) {
      TH.clearDB();
      v.conn && v.conn.close();
    },
  });

  require('koru/env!./test-helper')(TH);

  module.exports = TH;
});
