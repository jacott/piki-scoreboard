App.extend(App, {
  Fiber: Npm.require('fibers'),

  setTimeout: setTimeout,
  clearTimeout: clearTimeout,

  userId: function () {
    var ci = DDP._CurrentInvocation.get();
    return ci && ci.userId;
  },

  getSession: function (env) {
    var userId = env.userId;
    env.setUserId('getRemoteSocket');
    var sessions = Meteor.server.sessions;
    for (var key in sessions) {
      key = sessions[key];
      if (key.userId === 'getRemoteSocket') {
        var session = key;
        break;
      }
    }
    env.setUserId(userId);
    return session;
  },
});
