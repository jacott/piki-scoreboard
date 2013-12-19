TH.stubOplog = function () {
  var origObserve = AppOplog.observe;
  var origObservers = AppOplog.observers;
  var origstopAllObservers = AppOplog.stopAllObservers;
  geddon.test.onEnd(function () {
    AppOplog.observe = origObserve;
    AppOplog.observers = origObservers;
    AppOplog.stopAllObservers = origstopAllObservers;
    delete AppOplog.simulate;
  });

  var observers = {};
  var key = 1;

  AppOplog.observe = function (collName, callbacks) {
    if (collName in observers) throw new Error("Observer already exists for " + collName);
    observers[collName] = callbacks;
    return stopFunc(collName);
  },

  AppOplog.observers = function () {
    return observers;
  };

  AppOplog.stopAllObservers = function () {
    observers = {};
  };

  AppOplog.simulate = function(cmd, collName, id, attrs) {
    var observer = observers[collName];

    if (! observer) return;

    switch(cmd) {
    case 'i':
      var func = observer.ins;
      func && func(attrs);
      break;
    case 'u':
      var func = observer.upd;
      func && func(id, attrs);
      break;
    case 'd':
      var func = observer.del;
      func && func(id);
      break;
    }
  };

  function stopFunc(collName) {
    return {
      stop: function () {
        delete observers[collName];
      }
    };
  }
};
