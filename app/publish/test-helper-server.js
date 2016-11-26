define(function(require, exports, module) {
  const koru             = require('koru');
  const serverConnection = require('koru/session/server-connection-factory');
  const util             = require('koru/util');

  return function (TH) {
    const geddon = TH.geddon;

    util.merge(TH, {
      mockConnection (sessId, session) {
        var test = geddon.test;
        var conn = new (serverConnection(session || this.mockSession()))({send: test.stub(), on: test.stub()}, sessId || 's123', function () {});
        conn.userId = koru.userId();
        conn.sendBinary = test.stub();
        conn.added = test.stub();
        conn.changed = test.stub();
        conn.removed = test.stub();
        return conn;
      },

    });
  };

});
