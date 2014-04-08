// @export App

if (typeof deprecateWarning === 'undefined') {
  deprecateWarning = function () {

  };
}

var timeWarp = 0;

App = {
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,

  setNestedHash: function (value, hash /*, keys */) {
    var last = arguments.length-1;
    for(var i = 2; i < last; ++i) {
      var key = arguments[i];
      hash = hash[key] || (hash[key] = {});
    }

    return hash[arguments[last]] = value;
  },

  getNestedHash: function (hash /*, keys */) {
    var last = arguments.length-1;
    for(var i = 1; i < last; ++i) {
      var key = arguments[i];
      hash = hash[key];
      if (! hash) return undefined;
    }

    return hash[arguments[last]];
  },

  deleteNestedHash: function (hash /*, keys */) {
    var last = arguments.length-1;
    var prevs = [];
    for(var i = 1; i < last; ++i) {
      var key = arguments[i];
      prevs.push(hash);
      hash = hash[key];
      if (! hash) return undefined;
    }
    prevs.push(hash);

    var value = hash[arguments[last]];
    delete hash[arguments[last]];

    for(var i = prevs.length - 1; i >0; --i) {
      for (var noop in prevs[i]) {
        return value;
      }
      delete prevs[i-1][arguments[--last]];
    }
    return value;
  },

  log: function (/* arguments */) {
    console.log.apply(console, arguments);
  },

  extend: function (obj,properties) {
    for(var prop in properties) {
      Object.defineProperty(obj,prop,Object.getOwnPropertyDescriptor(properties,prop));
    }
    return obj;
  },

  reverseExtend: function (obj, properties, exclude) {
    for(var prop in properties) {
      if (exclude && prop in exclude) continue;
      if (! (prop in obj))
        Object.defineProperty(obj,prop,Object.getOwnPropertyDescriptor(properties,prop));
    }
    return obj;
  },

  closure: function () {
    return arguments[arguments.length-1].apply(arguments[0], arguments);
  },

  module: function (ns, options, func) {
    if (func == null) {
      func = options;
      options = {};
    } else
      options = options || {};

    var items = ns.split('.');
    var curr = this,
        oneLess = items.length - 1;

    for(var i=0,item;
        i < oneLess; ++i) {
      item = items[i];
      curr = curr[item] || (curr[item] = {});
    }
    item = items[oneLess];

    if (options.require || typeof func === 'function') {
      curr = curr[item] || (curr[item] = {});
      if (options.require) {
        App.require(options.require, function () {
          initModule(func, curr);
        });
      } else {
        initModule(func, curr);
      }
    } else {
      if (curr[item]) {
        curr = curr[item];
        App.extend(curr, func);
      } else {
        curr = curr[item] = func;
      }
    }
    return curr;
  },

  withDateNow: function (date, func) {
    date = +date;
    var thread = App.thread;
    var dates = thread.dates || (thread.dates = []);
    dates.push(thread.date);
    thread.date = date;
    try {
      return func();
    } finally {
      thread.date = dates.pop();
    }
  },

  timeWarp: function (value) {
    if (value != null) timeWarp = value;
    return timeWarp;
  },

  dateNow: function () {
    return App.thread.date || (Date.now() + timeWarp);
  },

  newDate: function () {
    return new Date(App.dateNow());
  },

  stackTrace: function (msg) {
    try {
      throw new Error("");
    } catch (e) {
      if (e.stackArray) {
        return e.stackArray.slice(2).map(function (src) {
          return '   '+src.sourceURL+':'+src.line+':\n';
        });
      } else if (e.stack) {
        return e.stack.split(/ at /).slice(3).map(function (src) {
          return '   at '+src;
        });
      }
    }
  },

  atSrcLine: function (msg) {
    try {
      throw new Error("");
    } catch (e) {
      if (e.stackArray) {
        var src = e.stackArray[2];
        return '   '+src.sourceURL+':'+src.line+':';
      } else if (e.stack) {
        var src = e.stack.split(/ at /);
        return '   at '+src[3];
      }
    }
  },
};

if (Meteor.isClient) {
  App.thread = {};
} else {
  (function () {
    var Fiber = Npm.require('fibers');
    Object.defineProperty(App, 'thread', {get: function () {
      return Fiber.current.appThread || (Fiber.current.appThread = {});
    }});
  })();
}

function initModule(func, curr) {
  if (typeof func === 'function')
    func.call(curr,curr);
  else
    App.extend(curr, func);
}


(function () {
  var funcs = {};

  function funcsFor(name) {
    return (funcs[name] || (funcs[name]=[]));
  }

  App.require = function (name, func) {
    if (name.forEach) {
      if (name.length > 1)
        func = nestedRequire(name.slice(1), func);
      name = name[0];
    }
    var funcs = funcsFor(name);

    if (funcs._loaded_)
      func.call(funcs._loaded_,funcs._loaded_);
    else
      funcs.push(func);
  };

  function nestedRequire(names, func) {
    return function (model) {
      App.require(names, func);
    };
  }

  App.loaded = function (name, self) {
    var funcs = funcsFor(name);

    self = self || App;
    funcs._loaded_ = self;
    for(var i=0,item;item=funcs[i];++i) {
      funcs[i] = null; // free memory
      item.call(self,self);
    }
  };

  App.unload = function (name) {
    delete funcs[name];
  };
})();


if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                               ? this
                               : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
