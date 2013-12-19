var replSetName, collNameIndex;

var observers = {};
var key = 1;
var meteorOplogHandle;

AppOplog = {
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
    }
  },
};

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

  if (! callbacks) return;

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
