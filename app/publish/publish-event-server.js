define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var Event = require('models/event');
  var env = require('koru/env');
  var Model = require('model');
  var Val = require('koru/model/validation');

  require('models/competitor');
  require('models/result');

  var orgChildren = ['Competitor', 'Result'];

  env.onunload(module, function () {
    publish._destroy('Event');
  });

  publish('Event', function (eventId) {
    Val.ensureString(eventId);
    var sub = this;

    var event = Event.findById(eventId);
    if (! event) return sub.error(new env.Error(404, 'Event not found'));
    event = null;

    var handles = [];

    sub.onStop(function () {
      handles.forEach(function (handle) {
        handle.stop();
      });
    });

    var sendUpdate = sub.sendUpdate.bind(sub);

    orgChildren.forEach(function (name) {
      var model = Model[name];
      handles.push(model.observeEvent_id(eventId, sendUpdate));
      model.query.where('event_id', eventId).forEach(sendUpdate);
    });
  });
});
