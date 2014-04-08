var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');

var replSetName = '', collNameIndex = 0;

var observers = {};
var key = 1;
var meteorOplogHandle;

var waitFors = {};
var wfKey = 1;

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
    get waitFors() {return waitFors},
    get wfKey() {return wfKey},
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
  beginWaitFor: function (collName, id, func) {
    if (Fiber.current._beginWaitFor) {
      func(-1);
      return;
    }


    var wf = Fiber.current._beginWaitFor = {
      model: collName, id: id,
      future: new Future(),
    };
    wf.token = ++wfKey;
    App.setNestedHash(wf, waitFors, collName, id, wf.token);

    wf.timeout = App.setTimeout(function () {
      var error = new Error('wait for "' + collName + '":"' + id + '" timed out');
      resetFuture(wf).throw(error);
    }, AppOplog.timeout);

    try {
      var result = func(wf);
      wf.future && wf.future.wait();
      return result;

    } finally {
      Fiber.current._beginWaitFor = null;
      resetFuture(wf);
    }
  },

  endWaitFor: endWaitFor,
});


function endWaitFor(wf) {
  if (wf === -1 || (wf && ! wf.future)) return;
  resetFuture(wf).return();
}

function resetFuture(wf) {
  if (! wf)
    return;

  App.clearTimeout(wf.timeout);
  wf.timeout = null;
  var f = wf.future;
  wf.future = null;
  App.deleteNestedHash(waitFors, wf.model, wf.id, wf.token);
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
    var tokens = App.getNestedHash(waitFors, collName, (result.op === 'u' ? result.o2._id : result.o._id));
    if (tokens) for (var key in tokens) {
      var wf = tokens[key];
      if (wf.model === collName &&
          wf.id === (result.op === 'u' ? result.o2._id : result.o._id)) {
        endWaitFor(wf);
      }
    }
  }
}
