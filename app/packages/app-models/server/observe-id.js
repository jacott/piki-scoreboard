AppModel._support.setupExtras.push(setup);

function setup(model) {
  var observers = {};
  var oplogObserver;
  var key = 0;
  var modelName = model.modelName;

  model.observeId = observeId;

  model.observeIds = observeIds;

  function observeId(id, callbacks) {
    var obs = observers[id] || (observers[id] = {});
    obs[++key] = callbacks;
    callbacks.added && callbacks.added(id, model.attrFind(id));
    oplogObserver || initOplogObserver();
    return stopObserver(id, obs, key, callbacks);
  };

  function stopObserver(id, obs, key, callbacks) {
    return {
      stop: function() {
        delete obs[key];
        var stopped = callbacks.stopped;
        stopped && stopped(id);
        for(key in obs) return;
        delete observers[id];
        for(key in observers) return;
        oplogObserver && oplogObserver.stop();
        oplogObserver = null;
      },

      id: id
    };
  }

  function observeIds(ids, callbacks) {
    return stopObservers(ids.map(function (id) {
      return observeId(id, callbacks);
    }), callbacks);
  }

  function stopObservers(obs, callbacks) {
    return {
      stop: function() {
        for(var i = 0; i < obs.length; ++i) {
          obs[i].stop();
        }
      },

      replaceIds: function (newIds) {
        var set = {};
        for(var i=0;i < obs.length;++i) {
          var ob = obs[i];
          set[ob.id]=ob;
        }

        obs = [];
        for(var i=0;i < newIds.length;++i) {
          var newId = newIds[i];
          if (newId in set) {
            obs.push(set[newId]);
            delete set[newId];
          } else {
            obs.push(observeId(newId, callbacks));
          }
        }
        for(var key in set) {
          set[key].stop();
          callbacks.removed && callbacks.removed(key);
        }
      },
    };
  }

  function initOplogObserver() {
    oplogObserver = model.observeOplog({
      upd: function (id, attrs) {
        var cbs = observers[id];
        if (cbs) for(var i in cbs) {
          var cb = cbs[i];
          cb && cb.changed && cb.changed(id, attrs);
        }
      },
      del: function (id) {
        var cbs = observers[id];
        if (cbs) for(var i in cbs) {
          var cb = cbs[i];
          cb && cb.removed && cb.removed(id);
        }
      }
    });
  }
};
