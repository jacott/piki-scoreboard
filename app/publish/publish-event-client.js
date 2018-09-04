define((require, exports, module)=>{
  const koru            = require('koru');
  const publish         = require('koru/session/publish');
  require('models/competitor');
  const Event           = require('models/event');
  require('models/result');

  const orgChildren = ['Competitor', 'Result'];

  koru.onunload(module, () => {publish._destroy('Event')});

  publish({name: 'Event', init(eventId) {
    const event = Event.findById(eventId);
    if (! event) return this.error(new koru.Error(404, 'event not found'));

    orgChildren.forEach(name => {this.match(name, matchOrg)});

    function matchOrg(doc) {return event._id === doc.event_id}
  }});
});
