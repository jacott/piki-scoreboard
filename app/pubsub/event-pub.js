define((require, exports, module) => {
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const Publication     = require('koru/pubsub/publication');
  const Union           = require('koru/pubsub/union');
  const util            = require('koru/util');
  const Competitor      = require('models/competitor');
  const Event           = require('models/event');
  const Result          = require('models/result');

  const OrgChildren = [Competitor, Result];

  const unions = util.createDictionary();

  class EventUnion extends Union {
    constructor(eventId) {
      super(EventPub);
      unions[this.eventId = eventId] = this;
    }

    onEmpty() {
      super.onEmpty();
      delete unions[this.eventId];
    }

    async loadInitial(encoder) {
      for (const model of OrgChildren) {
        for await (const doc of model.query.where('event_id', this.eventId)) {
          encoder.addDoc(doc);
        }
      }
    }

    initObservers() {
      const {handles, eventId} = this;
      for (const model of OrgChildren) {
        handles.push(model.observeEvent_id([eventId], this.batchUpdate));
      }
    }
  }

  class EventPub extends Publication {
    async init(eventId) {
      Val.ensureString(eventId);

      const event = await Event.findById(eventId);
      if (event === undefined) throw new koru.Error(404, 'Event not found');

      await (unions[eventId] ?? new EventUnion(eventId)).addSub(this);
    }

    static shutdown() {
      for (const eventId in unions) {
        const u = unions[eventId];
        u.onEmpty();
      }
    }
  }
  EventPub.module = module;

  return EventPub;
});
