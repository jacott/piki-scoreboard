App.extend(App, {
  userId: function () {
    return Meteor.userId();
  },

  formatSafe: function () {
    return new Handlebars.SafeString(App.format.apply(App.format, arguments));
  },

  subscribe: function () {
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

    Meteor.subscribe.apply(Meteor, args);
  },
});
