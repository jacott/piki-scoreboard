define(function(require, exports, module) {
  var koru = require('koru');
  var TH = require('test-helper');
  var util = require('koru/util');
  var Model = require('koru/model');
  var Val = require('koru/model/validation');
  var session = require('koru/session');
  var message = require('koru/session/message');
  var serverConnection = require('koru/session/server-connection');

  var geddon = TH.geddon;

  return util.extend({
    mockClientSub: function () {
      return {match: geddon.test.stub()};
    },

    mockSubscribe: function (v, id, name) {
      var test = geddon.test;
      if (! v.conn) {
        v.conn = new (serverConnection())({send: v.send = test.stub(), on: test.stub()}, 's123');
        v.conn.userId = koru.userId();
        v.conn.sendBinary = test.stub();
        v.conn.added = test.stub();
        v.conn.changed = test.stub();
        v.conn.removed = test.stub();
      }
      session._onMessage(v.conn, message.encodeMessage('P', [id, name, util.slice(arguments, 3)]));

      return v.conn._subs[id];
    },

    cleanUpTest: function (v) {
      TH.clearDB();
      v.conn && v.conn.closed();
    },
  }, TH);
});
