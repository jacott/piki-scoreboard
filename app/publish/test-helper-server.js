define((require)=>{
  const koru            = require('koru');
  const serverConnection = require('koru/session/server-connection-factory');

  return TH =>{
    TH.mockConnection = (sessId, session)=>{
      const {test} = TH;
      const conn = new (serverConnection(session || TH.mockSession()))({
        send: test.stub(), on: test.stub()}, {}, sessId || 's123', () => {});
      conn.userId = koru.userId();
      conn.sendBinary = test.stub();
      conn.added = test.stub();
      conn.changed = test.stub();
      conn.removed = test.stub();
      return conn;
    };
  };
});
