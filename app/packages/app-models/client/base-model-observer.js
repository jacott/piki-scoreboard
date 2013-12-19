App.extend(AppModel, {
  initIndex: function (model, docs) {
    var observers = {};
    var cache = {};
    var key = 1;

    var index = {
      observe: function (func) {
        observers[++key] = func;
        return stopFunc(key);
      },

      fetchDoc: function (attrs) {
        return cache[attrs._id] || (cache[attrs._id] = new model(attrs));
      },

      quickFind: function (id) {
        var doc = cache[id];
        if (doc) return doc;

        var attrs = model.docs._collection.docs[id];
        if (attrs)
          return cache[attrs._id] = new model(attrs);
      },
    };

    function stopFunc(myKey) {
      return {
        stop: function () {
          delete observers[myKey];
        }
      };
    }

    function inform(doc, old) {
      for(var key in observers) {
        observers[key](doc, old);
      }
    }

    index._observer = docs.find({}, {transform: null}).observe({
      added: function (doc) {
        inform(doc, null);
      },

      changed: function (doc, old) {
        if (doc._id in cache) cache[doc._id] = new model(doc);
        inform(doc, old);
      },

      removed: function (old) {
        if (old._id in cache) delete cache[old._id];
        inform(null, old);
      }
    });

    return model.Index = index;
  },
});
