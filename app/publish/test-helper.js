define(function(require, exports, module) {
  var env = require('koru/env');
  var TH = require('test-helper');
  var util = require('koru/util');
  var Model = require('koru/model');
  var Val = require('koru/model/validation');
  var session = require('koru/session');

  var geddon = TH.geddon;

  return util.extend({
    mockClientSub: function () {
      return {match: geddon.test.stub()};
    },

    mockSubscribe: function (v, name, id) {
      var test = geddon.test;
      session._onMessage(v.conn = {
        userId: env.userId(),
        added: test.stub(),
        changed: test.stub(),
        removed: test.stub(),
        ws: {send: v.send = test.stub()},
        _subs: {},
      }, 'P'+name+'|'+id+JSON.stringify(util.slice(arguments, 3)));

      return v.conn._subs[id];
    },

  }, TH);
});
