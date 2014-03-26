AppModel._support.setupExtras.push(setup);

var nullTf = {transform: null};

function setup(model) {
  var modelName = model.modelName;

  model.registerObserveField = registerObserveField;

  function registerObserveField(field) {
    var observers = {};
    var oplogObserver;
    var key = 0;
    var findFieldOpts = (function () {
      var fields = {};
      fields[field] = 1;
      return {transform: null, fields: fields};
    })();


    model['observe'+ Apputil.capitalize(field)] = function (values, options) {
      if (typeof values !== 'object') values = [values];
      if (options.added) {
        var query = {};
        query[field] = {$in: values};
        if (options.addedQuery) query = {$and: [query, options.addedQuery]};

        model.find(query, nullTf).forEach(function (doc) {
          options.added(doc._id, doc);
        });
      }

      var obsSet = {};
      var setKey = ++key;
      options = App.extend(options, {_key: setKey});
      for(var i=0;i < values.length;++i) {
        var ob = observeValue(values[i], options);
        obsSet[ob.value]=ob;
      }

      return stopObservers(obsSet, options);
    };

    function observeValue(value, options) {
      var obs = observers[value] || (observers[value] = {});
      obs[options._key] = options;
      oplogObserver || initOplogObserver();
      return stopObserver(value, obs, options);
    };

    function stopObserver(value, obs, options) {
      return {
        stop: function() {
          delete obs[options._key];
          var stopped = options.stopped;
          stopped && stopped(value);
          for(var key in obs) return;
          delete observers[value];
          for(var key in observers) return;
          oplogObserver && oplogObserver.stop();
          oplogObserver = null;
        },

        value: value
      };
    }

    function stopObservers(obsSet, options) {
      return {
        stop: function() {
          for(var key in obsSet) {
            obsSet[key].stop();
          }
        },

        addValue: function (value) {
          if (value.toString() in obsSet) return;

          var ob = observeValue(value, options);
          obsSet[value] = ob;

          if (options.added) {
            var query = {};
            query[field] = value;
            if (options.addedQuery) query = {$and: [query, options.addedQuery]};

            model.find(query, nullTf).forEach(function (doc) {
              options.added(doc._id, doc);
            });
          }
        },

        removeValue: function (value) {
          var ob = obsSet[value.toString()];
          if (! ob) return;

          ob.stop();
          delete obsSet[value.toString()];
          if (options.removed) {
            var removed = {};
            removed[field] = value;
            model.find(removed, findFieldOpts).forEach(function (doc) {
              if (! (doc[field].toString() in obsSet))
                options.removed(doc._id);
            });
          }
        },

        replaceValues: function (newValues) {
          var delObs = obsSet;
          obsSet = {};
          var addValues = [];
          for(var i=0;i < newValues.length;++i) {
            var newValue = newValues[i].toString(); // only use strings for keys
            if (newValue in delObs) {
              obsSet[newValue] = delObs[newValue];
              delete delObs[newValue];
            } else {
              var rawValue = newValues[i];
              addValues.push(rawValue);
              obsSet[newValue] = observeValue(rawValue, options);
            }
          }
          var oldValues = [];
          for(var value in delObs) {
            delObs[value].stop();
            oldValues.push(delObs[value].value);
          }
          var added = {};
          added[field] = {$in: addValues};
          model.find(added, nullTf).forEach(function (doc) {
            options.added(doc._id, doc);
          });
          if (options.removed) {
            var removed = {};
            removed[field] = {$in: oldValues};
            added[field] = {$nin: newValues};
            model.find({$and: [removed, added]}, findFieldOpts).forEach(function (doc) {
              options.removed(doc._id);
            });
          }
        },
      };
    }

    function initOplogObserver() {
      oplogObserver = model.observeOplog({
        ins: function (attrs) {
          callObservers(added, attrs[field], attrs._id, attrs);
        },

        lookup: field,

        upd: function (id, attrs) {
          if (field in attrs) {
            var memDoc = model.memFind(id);
            if (memDoc) {
              var called = callObservers(changed, memDoc[field], id, attrs);
            }
            callObservers(changed, attrs[field], id, attrs, called);
          } else {
            var doc = model.attrFind(id, findFieldOpts);
            if (doc) {
              model.addMemDoc(doc);
              try {
                callObservers(changed, doc[field], id, attrs);
              } finally {
                model.delMemDoc(doc._id);
              }
            }
          }
        },
        del: function (id) {
          var memDoc = model.memFind(id);
          if (memDoc) {
            var called = callObservers(removed, memDoc[field], id, memDoc);
          } // else no one knows about it?
        }
      });
    }

    function callObservers(func, value, id, attrs, called) {
      if (_.isArray(value)) {
        called = called || {};
        for(var v = 0; v < value.length; ++v) {
          var cbs = observers[value[v]];
          if (cbs) for(var i in cbs) {
            var cb = cbs[i];
            if (! (cb._key in called)) {
              called[cb._key] = true;
              func(cb, value, id, attrs);
            }
          }
        }
      } else {
        var cbs = observers[value];
        if (cbs) for(var i in cbs) {
          var cb = cbs[i];
          func(cb, value, id, attrs);
        }
      }
      return called;
    }

    function added(cb, value, id, attrs) {
      cb.added && cb.added(id, attrs);
    }

    function changed(cb, value, id, attrs) {
      cb.changed && cb.changed(id, attrs, value);
    }
    function removed(cb, value, id, attrs) {
      cb.removed && cb.removed(id, attrs, value);
    }
  }
};
