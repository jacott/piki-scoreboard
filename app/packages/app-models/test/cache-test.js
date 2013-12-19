(function () {
  buster.testCase('packages/app-models/cache:', {
    'test load/dump': function () {
      var cache = new App.Cache(3, {tooOld: 'notme', a: 'x', 'b': 'y', c: 'z'});

      assert.same(cache.get('b'),'y');

      assert.same(JSON.stringify(cache.dump()),'{"a":"x","c":"z","b":"y"}');
    },

    'test keys': function () {
      var cache = new App.Cache(3, {tooOld: 'notme', a: 'x', 'b': 'y', c: 'z'});

      assert.equals(cache.keys(), ["c", "b", "a"]);

      cache.set('new', 3);
      assert.equals(cache.keys(), ["new", "c", "b"]);
    },

    'test remove': function () {
      var cache = new App.Cache(2);

      cache.set('a',1);
      cache.set('b',2);

      assert.same(cache.remove('b'), 2);

      assert.same(JSON.stringify(cache.dump()),'{"a":1}');

      cache.set('c', 3);

      assert.same(JSON.stringify(cache.dump()),'{"a":1,"c":3}');

      assert.same(cache.remove('a'), 1);

      assert.same(JSON.stringify(cache.dump()),'{"c":3}');

      assert.same(cache.remove('a'), null);

      assert.same(JSON.stringify(cache.dump()),'{"c":3}');

      assert.same(cache.remove('c'), 3);

      assert.same(JSON.stringify(cache.dump()),'{}');
    },

    "test clear": function () {
      var cache = new App.Cache(2);

      cache.set('a',1);
      cache.set('b',2);

      cache.clear();

      assert.same(JSON.stringify(cache.dump()),'{}');
    },

    'test middle remove': function () {
       var cache = new App.Cache(3);

      cache.set('a',1);
      cache.set('b',2);
      cache.set('c',3);

      assert.same(cache.remove('b'), 2);

      assert.same(JSON.stringify(cache.dump()),'{"a":1,"c":3}');
    },

    'test get/set': function () {
      var cache = new App.Cache(2);

      cache.set('a',1);

      assert.same(cache.get('a'),1);
    },

    'test pruning': function () {
      var cache = new App.Cache(2);
      cache.set('a',1);
      cache.set('b',2);
      cache.set('c',3);

      refute(cache.get('a'));

      cache.set('a',1);
      refute(cache.get('b'));
      assert.same(cache.get('c'),3);
    },

    'test setting tail-1.next': function () {
      var cache = new App.Cache(2);
      cache.set('a',1);
      cache.set('b',2);

      cache.set('a',3);
      cache.set('b',4);
      assert.same(JSON.stringify(cache.dump()),'{"a":3,"b":4}');
    },

    'test refreshing': function () {
      var cache = new App.Cache(2);
      cache.set('a',1);
      cache.set('b',2);

      assert.same(cache.get('a'),1);
      cache.set('c',3);

      assert.same(cache.get('a'),1);
      refute(cache.get('b'));
    },
  });
})();
