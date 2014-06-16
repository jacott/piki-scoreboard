define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var Org = require('models/org');
  var koru = require('koru');
  var Model = require('model');
  var Val = require('koru/model/validation');
  var User = require('models/user');

  require('models/club');
  require('models/climber');
  require('models/event');
  require('models/category');


  var orgChildren = ['Club', 'Climber', 'Event', 'Category'];

  koru.onunload(module, function () {
    publish._destroy('Org');
  });

  publish('Org', function (shortName) {
    Val.ensureString(shortName);
    var sub = this;

    var org = Org.findByField('shortName', shortName);
    if (! org) return sub.error(new koru.Error(404, 'Org not found'));

    var handles = [];

    sub.onStop(function () {
      handles.forEach(function (handle) {
        handle.stop();
      });
    });

    var sendUpdate = sub.sendUpdate.bind(sub);

    handles.push(User.observeOrg_id(org._id, sendUser));
    User.query.where('org_id', org._id).forEach(sendUser);

    orgChildren.forEach(function (name) {
      var model = Model[name];
      handles.push(model.observeOrg_id(org._id, sendUpdate));
      model.query.where('org_id', org._id).forEach(sendUpdate);
    });

    function sendUser(doc, was) {
      if (doc && doc._id === sub.userId) return;
      sendUpdate(doc, was);
    }
  });
});
