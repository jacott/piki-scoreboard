isClient && define((require, exports, module)=>{
  const MockIndexedDB   = require('koru/model/mock-indexed-db');
  const Query           = require('koru/model/query');
  const QueryIDB        = require('koru/model/query-idb');
  const TH              = require('koru/model/test-db-helper');
  const session         = require('koru/session');
  const RPCIDBQueue     = require('koru/session/rpc-idb-queue');
  const offlineTestHelper = require('lib/offline-test-helper');
  const Factory         = require('test/factory');

  const {stub, spy, onEnd, util} = TH;

  const sut  = require('./idb');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      TH.startTransaction();
      v.indexedDB = new MockIndexedDB(0);
    });

    afterEach(()=>{
      sut.stop();
      TH.rollbackTransaction();
      v = {};
    });

    test("not supported", ()=>{
      stub(QueryIDB, "canIUse").returns(false);
      sut.start();
      assert.isFalse(sut.isStarted());
    });

    test("new", async ()=>{
      const isRpcPending = spy(RPCIDBQueue.prototype, 'isRpcPending');

      await sut.start();
      const {idb} = sut;

      assert(v.indexedDB._dbs['db-piki']._store);

      session.isRpcPending();
      assert.calledOnce(isRpcPending);
      assert(isRpcPending.firstCall.thisValue instanceof RPCIDBQueue);
    });
  });
});
