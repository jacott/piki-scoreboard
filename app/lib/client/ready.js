var key = 0;
var observers = {};

function stopFunc(cKey) {
  return {
    stop: function () {
      delete observers[cKey];
      for(var i in observers) return;
      key = 0;
    }
  };
}

App.Ready = {
  stopAll: function () {
    key = 0;
    observers = {};
  },

  isReady: false,

  notifyReady: function () {
    this.isReady = true;
    for(var i in observers) {
      observers[i]();
    }
  },

  setNotReady: function () {
    this.isReady = false;
  },

  onReady: function (func) {
    observers[++key] = func;
    if (this.isReady && func() === false)
      return;
    return stopFunc(key);
  }
};

function stopFunc(cKey) {
  return {
    stop: function () {
      delete observers[cKey];
      for(var i in observers) return;
      key = 0;
    }
  };
}