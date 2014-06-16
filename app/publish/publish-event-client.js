define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var koru = require('koru');
  var Event = require('models/event');
  require('models/competitor');
  require('models/result');

  var orgChildren = ['Competitor', 'Result'];

  koru.onunload(module, function () {
    publish._destroy('Event');
  });

  publish('Event', function (eventId) {
    var sub = this;

    var event = Event.findById(eventId);
    if (! event) return sub.error(new koru.Error(404, 'event not found'));

    orgChildren.forEach(function (name) {
      sub.match(name, matchOrg);
    });

    function matchOrg(doc) {
      return event._id === doc.event_id;
    }
  });
});
