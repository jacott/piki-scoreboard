define((require, exports, module)=>{
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const publish         = require('koru/session/publish');
  const Model           = require('model');
  require('models/competitor');
  const Event           = require('models/event');
  require('models/result');

  const orgChildren = ['Competitor', 'Result'];

  koru.onunload(module, () => {publish._destroy('Event')});

  publish({name: 'Event', init(eventId) {
    Val.ensureString(eventId);
    const event = Event.findById(eventId);
    if (! event) return this.error(new koru.Error(404, 'Event not found'));

    const handles = [];

    this.onStop(() => {handles.forEach(handle => {handle.stop()})});

    const sendUpdate = this.sendUpdate.bind(this);

    const {conn} = this;

    orgChildren.forEach(name => {
      const model = Model[name];
      handles.push(model.observeEvent_id([eventId], sendUpdate));
      model.query.where('event_id', eventId).forEach(
        doc => conn.added(name, doc._id, doc.attributes));
    });
  }});
});
