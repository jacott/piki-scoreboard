function Cache(size, init) {
  var store = this._store = {
    size: size,
    count: 0,
    hash: {},
    head: null,
    tail: null,
  };

  if(init)
    for(var key in init) {
      set(store,key,init[key]);
    }
};

App.Cache = Cache;

Cache.prototype = {
  constructor: Cache,

  set: function (key, value) {
    return set(this._store,key, value);
  },

  get: function (key) {
    return get(this._store, key);
  },

  remove: function (key) {
    return removeNode(this._store, key);
  },

  clear: function () {
    var store = this._store;
    store.head = store.tail = null;
    store.count = 0;
    store.hash = {};
  },

  keys: function () {
    var result = [];
    for(var node = this._store.tail;node;node = node.prev) {
      result.push(node.key);
    }
    return result;
  },

  dump: function () {
    var result = {};
    for(var node = this._store.head;node;node = node.next) {
      result[node.key] = node.data;
    }
    return result;
  },
};


function set(store, key, value) {
  var node = refreshNode(store,key) || newNode(store,key);

  node.data = value;

  if (store.count > store.size) {
    pruneHead(store);
  }

  return value;
}

function get(store, key) {
  var node = refreshNode(store,key);

  return node && node.data;
}

function refreshNode(store, key) {
  var node = store.hash[key];

  if (node == null || node === store.tail)
    return node;

  if (node === store.head)
    store.head = node.next;
  else
    node.prev.next = node.next;

  node.next.prev = node.prev;
  node.next = null;

  node.prev = store.tail;
  store.tail.next = node;
  store.tail = node;

  return node;
}

function removeNode(store, key) {
  var node = store.hash[key];

  delete store.hash[key];
  --store.count;

  if (node == null)
    return null;

  if (node === store.tail) {
    store.tail = node.prev;
  } else {
    node.next.prev = node.prev;
  }

  if (node === store.head)
    store.head = node.next;
  else
    node.prev.next = node.next;

  return node.data;
}

function pruneHead(store) {
  store.head.next && (store.head.next.prev = null);
  delete store.hash[store.head.key];
  store.head = store.head.next;
  --store.count;
}

function newNode(store, key) {
  ++store.count;
  var node = store.tail = store.hash[key] = {key: key, prev: store.tail};
  node.prev && (node.prev.next = node);

  store.head || (store.head = node);
  return node;
}
