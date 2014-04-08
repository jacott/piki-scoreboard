App.rpc = rpc;

App.makeSubject(rpc);

var count = 0;

rpc._private = {
  setCount: function (value) {
    count = value;
  },
};

App.extend(rpc, {
  get count() {
    return count;
  },
});

function rpc() {
  if (count === 0)
    rpc.notify(true);

  ++count;

  var args = Array.prototype.slice.call(arguments, 0);
  var last = args.length-1;

  if (typeof args[last] === 'function') {
    args[last] = retFunc(args[last]);
  } else {
    args.push(retFunc());
  }
  Meteor.call.apply(Meteor, args);
}

function retFunc(func) {
  return function(err, result) {
    if (--count === 0)
      rpc.notify(false);

    func && func(err, result);
  };
}
