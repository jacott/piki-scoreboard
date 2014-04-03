var Future = Npm.require('fibers/future');

var replSetName = '', collNameIndex = 0;

var observers = {};
var key = 1;
var meteorOplogHandle;

var waitCollName = null, waitId = null, future = null, timeout = null;

AppOplog = {
  timeout: 60000,

  observe: function (collName, callbacks) {
    meteorOplogHandle || startTailing();
    if (collName in observers) throw new Error("Observer already exists for " + collName);
    observers[collName] = callbacks;
    return stopFunc(collName);
  },

  observers: function () {
    return observers;
  },

  stopAllObservers: function () {
    if (meteorOplogHandle) {
      observers = {};
      meteorOplogHandle.stop();
      meteorOplogHandle = null;
      replSetName = '';
      collNameIndex = 0;
    }
  },

  _private: {
    get wait() {return [waitCollName, waitId]},
    get collNameIndex() {return collNameIndex},

    processEntry: processEntry,
    resetFuture: resetFuture,

    replaceFuture: function (value) {
      var ret = Future;
      Future = value;
      return ret;
    },
  }
};


App.extend(AppModel, {
  beginWaitFor: function (collname, id, func) {
    if (waitCollName) {
      func();
      return;
    }
    waitCollName = collname;
    waitId = id;
    timeout = setTimeout(function () {
      if (future) {
        var error = new Error('wait for "' + collname + '":"' + id + '" timed out');
        if (waitCollName === collname && waitId === id)
          resetFuture().throw(error);
      }
    }, AppOplog.timeout);

    future = new Future();

    try {
      var result = func();
      future && future.wait();

      return result;

    } catch(ex) {
      endWaitFor(collname, id);
      throw ex;
    } finally {
      waitCollName = null;
    }
  },

  endWaitFor: endWaitFor,
});


function endWaitFor(collname, id) {
  if (future && waitCollName === collname && waitId === id) {
    resetFuture().return();
  }
}

function resetFuture() {
  if (timeout) clearTimeout(timeout);
  if (waitCollName) waitCollName = -1;
  timeout = null;
  waitId = null;
  var f = future;
  future = null;
  return f;
}

function stopFunc(collName) {
  return {
    stop: function () {
      delete observers[collName];
      for (var key in observers) return;
      if (meteorOplogHandle) {
        meteorOplogHandle.stop();
        meteorOplogHandle = null;
      }
    }
  };
}

function startTailing() {
  var m = /:(\d+)\/(.*)$/.exec(process.env.MONGO_URL);
  replSetName = m[2];
  collNameIndex = replSetName.length+1;

  meteorOplogHandle = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry(
    {}, processEntry);
}


function processEntry(notification) {
  var result = notification.op;
  var collName = result.ns.slice(collNameIndex);

  var callbacks = observers[collName];

  try {
    if (callbacks) {
      switch(result.op) {
      case 'i':
        var func = callbacks.ins;
        func && func(result.o);
        break;
      case 'u':
        var func = callbacks.upd;
        func && func(result.o2._id, result.o.$set);
        break;
      case 'd':
        var func = callbacks.del;
        func && func(result.o._id);
        break;
      }
    }
  } finally {
    if (future !== null &&
        waitCollName === collName && waitId === (result.op === 'u' ? result.o2._id : result.o._id)) {
      endWaitFor(waitCollName, waitId);
    }
  }
}
