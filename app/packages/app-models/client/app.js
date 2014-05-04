App.extend(App, {
  setTimeout: function (func, to) {
    return window.setTimeout(func, to);
  },
  clearTimeout: function (handle) {
    return window.clearTimeout(handle);
  },

  userId: function () {
    return Meteor.userId();
  },

  subscribe: function () {
    if (typeof arguments[arguments.length - 1] !== 'function')
      return Meteor.subscribe.apply(Meteor, arguments);

    var args = Apputil.slice(arguments, 0);
    var callback = args.pop();

    args.push({
      onError: function (err) {
        if (err != null) {
        App.log('ERROR: ', err);
          App.globalErrorCatch && App.globalErrorCatch(err);
          callback && callback(err);
        }
      },
      onReady: callback,
    });

    return Meteor.subscribe.apply(Meteor, args);
  },
});
