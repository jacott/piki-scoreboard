define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var Query = require('koru/model/query');
  var Org = require('models/org');
  var User = require('models/user');
  var env = require('koru/env');
  var Model = require('model');
  require('models/club');
  require('models/climber');
  require('models/event');
  require('models/category');

  var orgChildren = ['Club', 'Climber', 'Event', 'Category'];

  env.onunload(module, function () {
    publish._destroy('Org');
  });

  publish('Org', function (shortName) {
    var sub = this;

    var org = Org.findByField('shortName', shortName);
    if (! org) return sub.error(new env.Error(404, 'Org not found'));

    var handles = [];

    sub.onStop(function () {
      handles.forEach(function (handle) {
        handle.stop();
      });
    });

    var sendUpdate = sub.sendUpdate.bind(sub);

    handles.push(User.observeOrg_id(org._id, sendUpdate));
    User.query.where('org_id', org._id).forEach(sendUpdate);

    orgChildren.forEach(function (name) {
      var model = Model[name];
      handles.push(model.observeOrg_id(org._id, sendUpdate));
      model.query.where('org_id', org._id).forEach(sendUpdate);
    });
  });
});
