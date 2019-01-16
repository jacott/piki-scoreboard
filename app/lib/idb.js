define((require)=>{
  const Query           = require('koru/model/query');
  const QueryIDB        = require('koru/model/query-idb');
  const session         = require('koru/session');
  const ClientRpcBase   = require('koru/session/client-rpc-base');
  const RPCIDBQueue     = require('koru/session/rpc-idb-queue');

  let stops = [];
  let idb = null;
  const monitor = {};

  const queueChange = (now, was)=>{idb.queueChange(now, was)};

  class IDB extends QueryIDB {
    constructor() {
      if (stops.length == 0) return;
      super({name: 'db-piki', version: 1, upgrade({db, transaction, oldVersion}) {
        switch(oldVersion) {
        case 0:
          db.createObjectStore('rpcQueue');
          break;
        }
      }});
    }

    static start() {
      if (! QueryIDB.canIUse()) return Promise.resolve();
      stops.push(
        Query.onAnyChange((now, was, flag) => {
          if (flag === 'stopped') return;
          const doc = (now == null ? was : now);
          const model = doc.constructor;
          const action = monitor[model.modelName];
          if (action !== undefined) action(now, was);
        }).stop,
      );
      idb = new IDB();
      const rpcQueue = new RPCIDBQueue(idb);
      ClientRpcBase(session, {rpcQueue});
      return idb.whenReady().then(() => {
        rpcQueue.reload(session);
      });
    }

    static stop() {
      if (! QueryIDB.canIUse()) return false;
      stops.forEach(stop => {stop()});
      stops = [];
      idb = null;
    }

    static isStarted() {
      return stops.length != 0;
    }

    static get idb() {return idb}
  }

  return IDB;
});
