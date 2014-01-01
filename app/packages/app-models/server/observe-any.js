AppModel._support.setupExtras.push(setup);

var nullTf = {transform: null};

function setup(model) {
  var modelName = model.modelName;
  var key = 0;
  var observers = {};
  var oplogObserver;

  model.observeAny = function (options) {
    if (options.added && options.addedQuery) {
      model.find(options.addedQuery, nullTf).forEach(function (doc) {
        options.added(doc._id, doc);
      });
    }

    return observe(options);
  };

  function observe(options) {
    observers[++key] = options;
    oplogObserver || initOplogObserver();
    return stopObserver(key, options);
  };

  function stopObserver(key, options) {
    return {
      stop: function() {
        delete observers[key];
        var stopped = options.stopped;
        stopped && stopped();
        for(key in observers) return;
        oplogObserver && oplogObserver.stop();
        oplogObserver = null;
      },
    };
  }

  function initOplogObserver() {
    oplogObserver = model.observeOplog({
      ins: function (attrs) {
        var id = attrs._id;
        for(var i in observers) {
          var cb = observers[i];
          cb.added && cb.added(id, attrs);
        }
      },

      upd: function (id, attrs) {
        for(var i in observers) {
          var cb = observers[i];
          cb.changed && cb.changed(id, attrs);
        }
      },

      del: function (id) {
        for(var i in observers) {
          var cb = observers[i];
          cb.removed && cb.removed(id);
        }
      }
    });
  }
}
