isClient && define((require, exports, module)=>{
  const koru            = require('koru');
  const MockCacheStorage = require('koru/client/mock-cache-storage');
  const MockIndexedDB   = require('koru/model/mock-indexed-db');
  const TH              = require('koru/test-helper');
  const util            = require('koru/util');

  const {stub, spy, intercept, match: m} = TH;

  const ServiceWorker = require('./service-worker');

  const staticCacheName = 'app-v3';
  const APP_ICONS_WOFF2 = '/public/app-icons-e4e23a2742db90efa1248eaf73efb6fc.woff2';

  const MAX_AGE_UNIT = 24 * 60 * 60 * 1000;
  const MAX_AGE = 30 * MAX_AGE_UNIT;
  const userCacheName = 'app-user';

  const staticCacheList = [
    '/manifest.json',
    APP_ICONS_WOFF2,

    // see also ui/defaults.css, ui/app.js
    'https://fonts.googleapis.com/css?family=Indie+Flower%7CPermanent+Marker',
  ];

  const BASE_ASSETS = ['/', '/index.css', '/index.js'];

  const lookInCacheUrl = '/images/icon1.png';
  const otherLookInCacheUrls = ['/images/picture.jpg', '/public/help.html'];

  const shouldAlsoFetchUrl = 'https://secure.gravatar.com/avatar/d2fc40c5527da8c6ede7703f5fb23d1d?d=blank';

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    let indexedDB, self, event;

    class Request {
      constructor(url) {
        this.url = url;
      }

      get method() {return 'GET'}

      clone() {
        return new Request(this.url);
      }
    }

    beforeEach(()=>{
      indexedDB = new MockIndexedDB(0);
      self = {
        addEventListener: stub(),
        URL: window.URL,
        location: new window.URL('https://koru.test/'),
        indexedDB,
        Request,
        Response: window.Response,
      };
      event = {
        waitUntil: stub(),
        respondWith: stub(),
      };
    });

    group("action messages", ()=>{
      let onmessage;
      beforeEach(()=>{
        self.fetch = url => Promise.resolve({url});
        self.caches = {};
        self.clients = {};
        ServiceWorker(self);
        assert.calledWith(self.addEventListener, 'message', m(func => onmessage = func));
      });

      test("loadBase", async ()=>{
        const {caches} = self;
        const staticCache = caches[staticCacheName] = {
          put: stub(),
        };
        caches.open = function (name) {return Promise.resolve(this[name])};
        event.data = {action: 'loadBase', search: '?search_str'};
        onmessage(event);
        await event.waitUntil.args(0, 0);

        for (const asset of BASE_ASSETS) {

          assert.calledWith(staticCache.put, 'https://koru.test'+asset,
                            {url: 'https://koru.test'+asset+'?search_str'});
        }
      });

      test("reload", async ()=>{
        const c1 = {postMessage: stub()};
        const c2 = {postMessage: stub()};

        const {clients} = self;
        self.skipWaiting = () => Promise.resolve(void 0);
        clients.matchAll = stub().withArgs({includeUncontrolled: true, type: 'window'})
          .returns(Promise.resolve([c1, c2]));

        event.data = {action: 'reload'};
        onmessage(event);

        await event.waitUntil.args(0, 0);

        assert.calledWith(c1.postMessage, {action: 'reload'});
        assert.calledWith(c2.postMessage, {action: 'reload'});
      });

      test("reloads if action unknown", async ()=>{
        const c1 = {postMessage: stub()};
        const {clients} = self;
        self.skipWaiting = () => Promise.resolve(void 0);
        clients.matchAll = stub().withArgs({includeUncontrolled: true, type: 'window'})
          .returns(Promise.resolve([c1]));

        event.data = {action: 'junk'};
        onmessage(event);

        await event.waitUntil.args(0, 0);

        assert.calledWith(c1.postMessage, {action: 'reload'});
      });
    });

    group("fetchAndCache", ()=>{
      let fetchAndCache, cacheQueue;
      beforeEach(()=>{
        self.caches = {};
        self.fetch = stub();
        const sw = ServiceWorker(self);
        fetchAndCache = sw.fetchAndCache;
        cacheQueue = sw.cacheQueue;
      });

      test("only GET cached", async ()=>{
        self.caches.open = stub();
        const response = {status: 200};
        self.fetch.returns({then: stub().yields(response)});
        assert.same(
          await fetchAndCache(staticCacheName, {method: 'PUT', url: '/index.js'}, true),
          response);

        refute.called(self.caches.open);
      });

      test("500 not cached", async ()=>{
        self.caches.open = stub();
        self.fetch.returns({then: stub().yields({status: 500})});

        await fetchAndCache(staticCacheName, {method: 'GET', url: '/index.js'}, true);

        refute.called(self.caches.open);
      });

      test("404 cached", async ()=>{
        const request = {method: 'GET', url: '/index.js'};
        const cache = {put: stub().withArgs(m.is(request)).returns("putResponse")};
        self.caches.open = stub().withArgs(staticCacheName).returns(
          new Promise((resolve, reject)=>{resolve(cache)}));
        const respClone = {};
        const fetchResp = {status: 404, clone: stub().returns(respClone)};
        self.fetch.withArgs("myReq")
          .returns(Promise.resolve(fetchResp));

        assert.same(
          await fetchAndCache(staticCacheName, request, "myReq"),
          fetchResp);

        assert.called(self.caches.open);
      });

      test("static not indexed", async ()=>{
        spy(cacheQueue, 'then');
        const respClone = {};
        const request = {method: 'GET', url: '/index.js'};
        const cache = {put: stub().withArgs(m.is(request), m.is(respClone)).returns("putResponse")};
        self.caches.open = stub().withArgs(staticCacheName).returns(
          new Promise((resolve, reject)=>{resolve(cache)}));

        const fetchResp = {status: 200, clone: stub().returns(respClone)};
        self.fetch.withArgs("myReq")
          .returns(Promise.resolve(fetchResp));

        assert.same(
          await fetchAndCache(staticCacheName, request, "myReq"),
          fetchResp);

        refute.called(cacheQueue.then);
      });

      test("storing in db", async ()=>{
        let openResolve;
        const openPromise = new Promise(r =>{openResolve = r});
        spy(indexedDB, 'open').invokes(c =>(openResolve(c),c.returnValue));

        const now = Date.now();
        stub(Date, 'now').returns(now);

        const respClone = {};
        const request = {method: 'GET', url: lookInCacheUrl};
        const cache = {put: stub().withArgs(m.is(request), m.is(respClone)).returns("putResponse")};
        self.caches.open = stub().withArgs(userCacheName).returns(
          new Promise((resolve, reject)=>{resolve(cache)}));

        const fetchResp = {status: 200, clone: stub().returns(respClone)};
        self.fetch.withArgs("myReq")
          .returns(Promise.resolve(fetchResp));

        assert.same(
          await fetchAndCache(userCacheName, request, "myReq"),
          fetchResp);

        await openPromise;

        const store = indexedDB._dbs.sw._store.userCache.docs;

        assert.equals(store, {[lookInCacheUrl]: {url: lookInCacheUrl, timestamp: now}});
      });

      test("bustCache", async()=>{
        self.fetch.returns({then: stub().yields({status: 200, clone: stub().returns({})})});

        await fetchAndCache(staticCacheName, {url: '/foo'}, '/foo?test_bust');

        assert.calledWith(self.fetch, '/foo?test_bust');
      });
    });

    test("fetching from user-cache updates timestamp", async ()=>{
      let now = 0;
      intercept(Date, 'now', () => now += MAX_AGE_UNIT);
      const {respondWith} = event;
      let count = 0;
      self.fetch = req => {
        const resp = {status: 200, req, count: ++count, clone() {return Object.assign({}, this)}};
        return Promise.resolve(resp);
      };
      self.caches = new MockCacheStorage();
      const fetchListener = self.addEventListener.withArgs('fetch');

      ServiceWorker(self);

      const url1 = 'https://koru.test/'+lookInCacheUrl;
      const [url2, url3] = otherLookInCacheUrls.map(u => 'https://koru.test/'+u);

      let ans;
      const call = async url =>{
        event.request = new self.Request(url);
        fetchListener.yield(event);

        assert.calledOnce(respondWith);

        ans = await respondWith.firstCall.args[0];
        respondWith.reset();
      };

      /** not in cache **/

      await call(url1);
      const store = indexedDB._dbs.sw._store.userCache.docs;

      assert.same(ans.count, 1);
      assert.same(ans.req.url, url1);
      assert.same(ans.status, 200);
      assert.equals(store, {[url1]: {url: url1, timestamp: MAX_AGE_UNIT}});


      await call(url2);

      assert.same(ans.count, 2);
      assert.same(ans.req.url, url2);
      assert.same(ans.status, 200);
      assert.equals(store[url2], {url: url2, timestamp: 2 * MAX_AGE_UNIT});


      /** cache lookup **/
      await call(url1);

      assert.same(ans.count, 1); // fetch not called
      assert.same(ans.req.url, url1);
      assert.same(ans.status, 200);


      assert.equals(store[url1], {url: url1, timestamp: 3 * MAX_AGE_UNIT}); // updates timestamp

      assert.equals(store[url2], {url: url2, timestamp: 2 * MAX_AGE_UNIT}); // not touched

      /** caches for max one month **/

      now += MAX_AGE - MAX_AGE_UNIT;

      await call(url3);
      await 1;

      assert.same(store[url2], void 0); // deleted
      assert.equals(store[url1], {url: url1, timestamp: 3 * MAX_AGE_UNIT}); // updates timestamp
      assert.equals(store[url3], {url: url3, timestamp: 33 * MAX_AGE_UNIT}); // updates timestamp
    });

    group("fetch", ()=>{
      let staticResponse, fetchListener;
      beforeEach(()=>{
        staticResponse = void 0;
        self.caches = {
          open(name) {return Promise.resolve(this[name])},
          [staticCacheName]: {
            match({url}) {return Promise.resolve(staticResponse)},
            put: stub(()=> new Promise(stub())),
          },

          match({url}) {return Promise.resolve(this[url])},
          'https://koru.test/a/b': 'my response',
        };

        self.fetch = stub();
        fetchListener = self.addEventListener.withArgs('fetch');

        ServiceWorker(self);
        assert.called(fetchListener);
      });

      group("assetCache", ()=>{
        let put, request, resp;
        beforeEach(()=>{
          self.caches[userCacheName] = {
            match({url}) {return Promise.resolve(null)},
            put: put = stub(()=> new Promise(stub())),
          };
          request = async url => {
            event.request = {url, clone() {return {url, cloned: true}}};
            fetchListener.yield(event);

            const store = {clone() {return 'cloned'}};
            self.fetch.withArgs(m(r => r.cloned && r.url === url)).returns(Promise.resolve(store));
            const resp = await event.respondWith.args(0, 0);
            event.respondWith.reset();

            assert.same(resp, store);
          };
        });


        test("lookInCacheUrls", async ()=>{
          await request('https://koru.test/'+lookInCacheUrl);
          for (const url of otherLookInCacheUrls) {
            await request('https://koru.test/'+url);
          }
        });
      });

      test("avatar", async ()=>{
        const avatarOrig = {avatarOrig: true};
        const avatar = {status: 200, clone() {return 'cloned'}};
        let put = stub().returns(Promise.resolve());
        self.caches[userCacheName] = {
          match({url}) {return Promise.resolve(avatarOrig)},
          put,
        };
        const url = shouldAlsoFetchUrl;
        event.request = {
          url,
          method: 'GET',
          clone() {return {url, cloned: true}},
        };
        self.fetch.withArgs(m(r => r.cloned && r.url === url)).returns(Promise.resolve(avatar));
        fetchListener.yield(event);
        assert.calledOnce(event.respondWith);
        const resp = await event.respondWith.args(0, 0);

        assert.same(resp, avatarOrig);

        assert.calledWith(put, event.request, 'cloned');
      });

      test("cached", async ()=>{
        event.request = {url: 'https://koru.test/a/b'};
        fetchListener.yield(event);
        const resp = await event.respondWith.args(0, 0);

        assert.same(resp, 'my response');
      });

      test("not cached", async ()=>{
        event.request = {url: 'https://koru.test//a/c'};
        fetchListener.yield(event);

        const fetchPromise = Promise.resolve('fetch promise');
        self.fetch.withArgs(event.request).returns(fetchPromise);

        const resp = await event.respondWith.args(0, 0);

        assert.same(resp, 'fetch promise');
      });

      test("reload asset cached", async ()=>{
        staticResponse = 'static response';
        event.request = {url: 'https://koru.test/index.css?CACHE_BUSTER', clone() {}};
        fetchListener.yield(event);

        assert.called(event.respondWith);

        const resp = await event.respondWith.args(0, 0);

        assert.same(resp, 'static response');
      });

      test("reload asset fetch", async ()=>{
        event.request = {
          method: 'GET',
          url: 'https://koru.test/index.js?CACHE_BUSTER1',
          clone: () => ({
            url: 'https://koru.test/index.js?CACHE_BUSTER2',
          })
        };

        fetchListener.yield(event);

        assert.called(event.respondWith);

        const nwResp = {status: 200, clone() {return "cloned message"}};

        const fetchPromise = Promise.resolve(nwResp);

        self.fetch.returns(fetchPromise);

        const resp = await event.respondWith.args(0, 0);

        assert.calledWith(self.fetch, {url: 'https://koru.test/index.js?CACHE_BUSTER2'});

        assert.same(resp, nwResp);

        assert.calledWith(self.caches[staticCacheName].put, {url: '/index.js'}, 'cloned message');
      });
    });

    test("activate", async ()=>{
      const caches = self.caches = {
        keys() {return Promise.resolve(['c2', staticCacheName, 'c3'])},
        delete: stub(),
      };
      const clients = self.clients = {
        claim: stub().invokes(() => Promise.resolve()),
      };

      const activate = self.addEventListener.withArgs('activate');
      ServiceWorker(self);
      assert.called(activate);
      activate.yield(event);

      await event.waitUntil.args(0, 0);

      assert.calledTwice(caches.delete);
      assert.calledWith(caches.delete, 'c2');
      assert.calledWith(caches.delete, 'c2');
      refute.calledWith(caches.delete, staticCacheName);

      assert.called(clients.claim);
    });

    test("install", async ()=>{
      const caches = self.caches = {
        open(name) {return Promise.resolve(this[name])},
        [staticCacheName]: {addAll: stub('addAll', null, () => Promise._resolveOrReject())},
      };

      const install = self.addEventListener.withArgs('install');
      ServiceWorker(self);
      assert.called(install);
      install.yield(event);

      await event.waitUntil.args(0, 0);

      refute.called(caches[staticCacheName].addAll);
    });
  });
});
