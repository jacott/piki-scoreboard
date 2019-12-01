if (typeof window === 'undefined') self.define = body =>{body()(self)};

define(() => self =>{
  'use strict';

  /*** configurable constants ***/

  const staticCache = 'app-v3'; // does not expire
  const APP_ICONS_WOFF2 = '/public/app-icons-e4e23a2742db90efa1248eaf73efb6fc.woff2';

  // expire non staticCache objects when last fetch is older than MAX_AGE
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
  const userCache = 'app-user';

  // caches will be deleted if not in CACHE_MAP
  const CACHE_MAP = {[staticCache]: true, [userCache]: true};

  // see also ui/defaults.css, ui/app.js
  // const FONTS_URL = 'https://fonts.googleapis.com/css?family=Indie+Flower%7CPermanent+Marker';

  // loaded when service-worker is updated
  const staticCacheList = [
    '/manifest.json',
    APP_ICONS_WOFF2,
//    FONTS_URL,
  ];

  // loaded when new app version released even if service worker does not change
  // (see koru/client/sw-manager.js)
  const BASE_ASSETS = ['/', '/index.css', '/index.js',];

  const NO_CACHE_MAP = {
    '/force-reload.js': true
  };

  // do not use cache; just fetch
  const shouldNeverCache = (url, request)=>{
    return url.origin === location.origin
      && NO_CACHE_MAP[url.pathname] !== void 0;
  };

  // only fetch if not in cache
  const shouldLookInCache = (url, request)=> {
    // if (url.origin === 'https://fonts.gstatic.com')
    //   return staticCache;
    if (url.host.endsWith(location.host)) {
      if (/\/(?:public|images)\//.test(url.pathname))
        return userCache;
    }
  };

  // serve cache but also update cache with re-fetch
  const shouldAlsoFetch = (url, request)=>{
    if (url.origin === 'https://secure.gravatar.com' && url.pathname.startsWith('/avatar/'))
      return userCache;
  };

  /** end of configurable constants **/



  const {
    Request, URL, location, Response,
    clients, caches, fetch, indexedDB
  } = self;

  const isFetchOK = status => status < 400 ||
        (status >= 404 && status <= 407) || status == 401 || status == 410;

  const STATIC_ASSETS_MAP = {};

  for (const r of BASE_ASSETS) STATIC_ASSETS_MAP[r] = true;
  for (const r of staticCacheList) STATIC_ASSETS_MAP[r] = true;

  const reportErr = err=>{
    console.error(err);
    return new Response('Unexpected error', {status: 500, statusText: err.toString()});
  };


  const ACTIONS = {
    loadBase: async data =>{
      try {
        const bustCache = data.search;
        const cache = await caches.open(staticCache);
        await Promise.all(BASE_ASSETS.map(async pathname => {
          const url = location.origin + pathname;
          const resp = await fetch(url+bustCache);
          await cache.put(url, resp);
        }));
        await self.skipWaiting();
        const BASE_LOADED = {action: 'baseLoaded'};
        const list = await clients.matchAll({includeUncontrolled: true, type: 'window'});
        for (const client of list) client.postMessage(BASE_LOADED);
      } catch(err) {
        return reportErr(err);
      }
    },

    reload: async data =>{
      try {
        await self.skipWaiting();
        const RELOAD = {action: 'reload'};
        const list = await clients.matchAll({includeUncontrolled: true, type: 'window'});
        for (const client of list) client.postMessage(RELOAD);
      } catch(err) {
        return reportErr(err);
      }
    },
  };

  const onupgradeneeded = event =>{
    for (const sn of ["userCache"]) {
      const objectStore = event.target.result.createObjectStore(sn, {keyPath: "url"});
      objectStore.createIndex("timestamp", "timestamp", {unique: false});
    }
  };

  const dbOpen = (callback)=>{
    const request = indexedDB.open('sw', 1);

    request.onupgradeneeded = onupgradeneeded;
    request.onsuccess = event =>{callback(null, event.target.result)};
    request.onerror = callback;
  };

  const dbAddUrl = (db, url, timestamp, callback)=>{
    const transaction = db.transaction('userCache', 'readwrite');
    const objectStore = transaction.objectStore('userCache');

    objectStore.put({url, timestamp});

    transaction.oncomplete = ()=>{callback(null, db)};
    transaction.onabort = ()=>{callback(transaction.error)};
  };

  const dbExpire = (db, timestamp, callback)=>{
    const expireBefore = timestamp - MAX_AGE;
    const urls = [];

    const transaction = db.transaction('userCache', 'readwrite');
    const objectStore = transaction.objectStore('userCache');
    const index = objectStore.index('timestamp');

    index.openCursor().onsuccess = ({target: {result: cursor}})=>{
      if (cursor != null) {
        if (expireBefore > cursor.value.timestamp) {
          const {url} = cursor.value;
          urls.push(url);
          objectStore.delete(url);
          cursor.continue();
        }
      }
    };

    transaction.oncomplete = ()=>{callback(null, urls)};
    transaction.onabort = callback;
  };

  const trackEntry = (url, timestamp, cache)=> new Promise((resolve, reject)=>{
    dbOpen((err, db)=>{
      if (err) return reject(err);
      dbAddUrl(db, url, timestamp, (err)=>{
        if (err) return reject(err);
        dbExpire(db, timestamp, (err, urls)=>{
          if (err) return reject(err);
          Promise.all(urls.map(url => cache.delete(url)))
            .then(resolve, reject);
        });
      });
    });
  });

  const updateCacheTs = (cacheName, request, response)=>{
    if (cacheName !== staticCache) {
      dbOpen((err, db)=>{
        if (err) return reportErr(err);
        dbAddUrl(db, request.url, Date.now(), (err)=>{
          if (err) return reportErr(err);
        });
      });
    }

    return response;
  };

  const cacheQueue = Promise.resolve();

  const fetchAndCache = async (cacheName, request, fetchReq=request.clone())=>{
    const timestamp = Date.now();
    const response = await fetch(fetchReq);
    if (request.method === 'GET' && isFetchOK(response.status)) {
      const cr = response.clone();
      const cache = await caches.open(cacheName);
      const pr = cache.put(request, cr);
      if (cacheName !== staticCache) {
        await pr;
        cacheQueue.then(()=> trackEntry(request.url, timestamp, cache)).catch(reportErr);
      }
    }

    return response;
  };

  const cacheFirst = async (name, request, fetchReq)=>{
    try {
      const cache = await caches.open(name);
      const response = await cache.match(request);
      return await response
        ? updateCacheTs(name, request, response)
        : fetchAndCache(name, request, fetchReq);
    } catch(err) {
      return reportErr(err);
    }
  };

  const loadBoth = async (name, request)=>{
    try {
      const cache = await caches.open(name);
      const response = await cache.match(request);
      const network = await fetchAndCache(name, request);
      return await response ? updateCacheTs(name, request, response) : network;
    } catch(err) {
      return reportErr(err);
    }
  };

  const loadStaticAssets = async ()=>{
    // const cache = await caches.open(staticCache);
    // await cache.addAll(staticCacheList);
    // const resp = await fetch(FONTS_URL);
    // const text = await resp.text();
    // const re = /url\(['"]?(https:\/\/.*\.woff2)['"]?\)/g;
    // let m;
    // while ((m = re.exec(text)) !== null) {
    //   await fetchAndCache(staticCache, new Request(m[1]));
    // }
  };


  self.addEventListener('install', event => {
    event.waitUntil(loadStaticAssets().catch(reportErr));
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => Promise.all(
        cacheNames.filter(cacheName => ! CACHE_MAP[cacheName])
            .map(cacheName => caches.delete(cacheName))))
        .then(()=> clients.claim()).catch(reportErr)
    );
  });

  self.addEventListener('fetch', event => {
    const {request} = event;
    const url = new URL(event.request.url);
    if (shouldNeverCache(request, url))
      return;

    if (url.origin === location.origin) {
      if (STATIC_ASSETS_MAP[url.pathname] !== void 0) {
        event.respondWith(cacheFirst(staticCache, new Request(
          url.pathname, {credentials: 'omit'}), request.clone()));
        return;
      }
    }
    let cacheName;

    cacheName = shouldLookInCache(url, request);
    if (cacheName !== void 0) {
      event.respondWith(cacheFirst(cacheName, request));
      return;
    }

    cacheName = shouldAlsoFetch(url, request);
    if (cacheName !== void 0) {
      event.respondWith(loadBoth(cacheName, request));
      return;
    }

    event.respondWith(
      caches.match(request).then(response => response || fetch(request)).catch(reportErr)
    );
  });

  self.addEventListener('message', event => {
    const {data} = event;
    event.waitUntil(data.action && (ACTIONS[data.action]||ACTIONS.reload)(data));
  });

  return { // for testing
    fetchAndCache,
    cacheQueue
  };
});
