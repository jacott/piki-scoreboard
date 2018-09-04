define((require)=>{
  const koru            = require('koru');
  const MockIndexedDB   = require('koru/model/mock-indexed-db');
  const MockPromise     = require('koru/test/mock-promise');
  const util            = require('koru/util');

  return (TH, v, {dbVersion=100}={})=>{
    const indexedDB = v.indexedDB || (v.indexedDB = new MockIndexedDB(dbVersion));
    TH.stubProperty(window, 'Promise', {value: MockPromise});
    TH.stubProperty(koru, 'unexpectedError', {value(e) {v.err =e}});

    TH.test.onEnd(() => {
      if (v.err)
        koru.unhandledException(v.err);
      MockPromise._stop();
    });

    util.merge(v, {
      get db() {return indexedDB._dbs['db-opre-counter']},

      poll(count=1) {
        for(let i = 0; i < count; ++i) {
          indexedDB.yield();
          Promise._poll();
        }
      },

      flush(max=10) {
        indexedDB.yield();
        while (--max >= 0 && Promise._pendingCount() > 0) {
          Promise._poll(); indexedDB.yield();
        }
      },

      addRecs(modelName, recs, db=v.db) {
        const {docs} = db._store[modelName] ||
                db.createObjectStore(modelName, {keyPath: '_id'});

        recs.forEach(rec => {docs[rec._id] = rec});
      },

      assertNoIDB() {
        assert.called(v.ready);
        assert.same(v.callback, v.sub.callback);
        refute.called(v.callback);
      },

      ensureOS(n, db=v.db) {
        return db._store[n] ||
          db.createObjectStore(n, {keyPath: '_id'});
      }
    });
  };
});
