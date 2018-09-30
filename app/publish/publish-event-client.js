define((require, exports, module)=>{
  const koru            = require('koru');
  const publish         = require('koru/session/publish');
  const Competitor      = require('models/competitor');
  const Event           = require('models/event');
  const Result          = require('models/result');

  require('models/result');

  const orgChildren = [Competitor, Result];

  koru.onunload(module, () => {publish._destroy('Event')});

  publish({name: 'Event', init(eventId) {
    const event = Event.findById(eventId);
    const matchOrg = doc => event._id === doc.event_id;

    if (! event) return this.error(new koru.Error(404, 'event not found'));

    orgChildren.forEach(model => {this.match(model.modelName, matchOrg)});

    this.onStop((sub, unmatch)=>{
      for (const model of orgChildren) {
        const {docs} = model;
        for (const id in docs) {
          const doc = docs[id];
          matchOrg(doc) && unmatch(doc);
        };
      }
    });
  }});
});
