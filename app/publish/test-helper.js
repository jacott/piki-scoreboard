define(function(require, exports, module) {
  var koru = require('koru');
  var TH = require('test-helper');
  var util = require('koru/util');
  var Model = require('model');
  var Val = require('koru/model/validation');
  var session = require('koru/session');
  var message = require('koru/session/message');
  var serverConnection = require('koru/session/server-connection');

  var geddon = TH.geddon;

  return util.extend({
    mockClientSub: function () {
      var sub = {
        match: geddon.test.stub(),
        onStop: function (func) {
          geddon.test.onEnd(func);
        },
      };

      geddon.test.spy(sub, 'onStop');
      return sub;
    },

    stubMatchers: function (sub, names) {
      var matchers = {};
      names.split(' ').forEach(function (name) {
        matchers[name] = sub.match.withArgs(name, TH.match.func);
      });
      return matchers;
    },

    assertMatchersCalled: function (matchers) {
      var funcs = {};
      for (var key in matchers) {
        var match = matchers[key];
        assert.calledOnce(match);
        funcs[key] = match.args(0, 1);
      }
      return funcs;
    },

    mockConnection: function (sessId, session) {
      var test = geddon.test;
      var conn = new (serverConnection(session || this.mockSession()))({send: test.stub(), on: test.stub()}, sessId || 's123', test.stub());
      conn.userId = koru.userId();
      conn.sendBinary = test.stub();
      conn.added = test.stub();
      conn.changed = test.stub();
      conn.removed = test.stub();
      return conn;
    },

    mockSession: function () {
      return {globalDict: message.newGlobalDict()};
    },

    mockSubscribe: function (v, id, name) {
      if (! v.session) v.session = this.mockSession();
      if (! v.conn) {
        v.conn = this.mockConnection(null, v.session);
        v.send = v.conn.ws.send;
      }
      session._onMessage(v.conn, message.encodeMessage('P', [id, name, util.slice(arguments, 3)], v.session.globalDict));

      return v.conn._subs[id];
    },

    cleanUpTest: function (v) {
      TH.clearDB();
      v.conn && v.conn.close();
    },
  }, TH);
});
