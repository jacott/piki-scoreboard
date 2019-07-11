define((require, exports, module)=>{
  const koru            = require('koru');
  const AllSub          = require('koru/pubsub/all-sub');
  const Org             = require('models/org');
  const User            = require('models/user');

  class SelfSub extends AllSub {
    constructor() {
      super();
      this.match('User', doc => doc._id === koru.userId());
    }
  }
  SelfSub.module = module;

  SelfSub.includeModel('Org');

  return SelfSub;
});
