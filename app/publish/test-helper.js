define(function(require, exports, module) {
  var env = require('koru/env');
  var TH = require('test-helper');
  var util = require('koru/util');
  var Model = require('koru/model');
  var Val = require('koru/model/validation');
  var session = require('koru/session');
  var message = require('koru/session/message');

  var geddon = TH.geddon;

  return util.extend({
    mockClientSub: function () {
      return {match: geddon.test.stub()};
    },

    mockSubscribe: function (v, id, name) {
      var test = geddon.test;
      session._onMessage(v.conn = {
        userId: env.userId(),
        added: test.stub(),
        changed: test.stub(),
        removed: test.stub(),
        sendBinary: test.stub(),
        ws: {send: v.send = test.stub()},
        _subs: {},
      }, message.encodeMessage('P', [id, name, util.slice(arguments, 3)]));

      return v.conn._subs[id];
    },

  }, TH);
});
