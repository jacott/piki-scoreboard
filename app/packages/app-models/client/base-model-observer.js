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

      addUniqueIndex: function () {
        var fields = arguments;
        var len = fields.length;
        var leadLen = len - 1;
        var idx = {};
        index.observe(function (doc, old) {
          if (doc) {
            if (old) {
              for(var i = 0; i < len; ++i) {
                var field = fields[i];
                if (doc[field] != old[field]) {
                  deleteEntry(idx, old, 0);
                  break;
                }
              }
              if (i === len) return;
            }
            var tidx = idx;
            for(var i = 0; i < leadLen; ++i) {
              var value = doc[fields[i]];
              tidx = tidx[value] || (tidx[value] = {});
            }
            var value = doc[fields[leadLen]];
            if (value in tidx)
              App.log("Error: Duplicate entry in index: " + model.modelName + "> " +
                      Array.prototype.join.call(fields, ",") + "\n" +
                      tidx[value] + " clashes with " + doc._id);
            else
              tidx[value] = doc._id;
          } else if (old) {
            deleteEntry(idx, old, 0);
          }
        });
        return function (keys) {
          var ret = idx;
          for(var i = 0; ret && i < len; ++i) {
            var key = keys[fields[i]];
            if (! key) return ret;
            ret = ret[key];
          }
          return ret;
        };

        function deleteEntry(tidx, doc, count) {
          var value  = doc[fields[count]];
          if (! tidx) return true;
          if (count < leadLen && ! deleteEntry(tidx[value], doc, count+1)) {
            return false;
          }
          delete tidx[value];
          for(var noop in tidx) return false;
          return true;
        }
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
        if (! old) return;
        if (old._id in cache) delete cache[old._id];
        inform(null, old);
      }
    });

    return model.Index = index;
  },
});
