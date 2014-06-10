define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var Query = require('koru/model/query');
  var Org = require('models/org');
  var User = require('models/user');
  var env = require('koru/env');

  env.onunload(module, function () {
    publish._destroy('Self');
  });

  publish('Self', function () {
    var sub = this;
    if (! sub.userId) {
      sub.setUserId(User.guestUser()._id);
      return;
    }
    var user = User.findById(sub.userId);

    if (! user) {
      sub.error(new env.Error(404, 'User not found'));
      return;
    }

    var handles = [];

    sub.onStop(function () {
      handles.forEach(function (handle) {
        handle.stop();
      });
    });

    var sendUpdate = sub.sendUpdate.bind(sub);

    // Publish self
    handles.push(User.observeId(user._id, sendUpdate));
    sendUpdate(user);

    // Publish all orgs
    handles.push(Org.onChange(sendUpdate));
    Org.query.forEach(sendUpdate);
  });
});
