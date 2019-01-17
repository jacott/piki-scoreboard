define((require, exports, module)=>{
  const Subscription    = require('koru/pubsub/subscription');
  const Competitor      = require('models/competitor');
  const Result          = require('models/result');

  const EventModels = [Competitor, Result];

  class EventSub extends Subscription {
    constructor(event_id) {
      super(event_id);
      const inEvent = (doc)=> doc.event_id === event_id;
      for (const model of EventModels)
        this.match(model.modelName, inEvent);
    }

    stopped(unmatch) {
      const event_id = this.args;
      for (const model of EventModels)
        model.where({event_id}).forEach(unmatch);
    }

    reconnecting() {
      this.lastSubscribed = 0; // reload all records
      const event_id = this.args;
      for (const model of EventModels)
        model.where({event_id}).forEach(Subscription.markForRemove);
    }
  }
  EventSub.module = module;

  return EventSub;
});
