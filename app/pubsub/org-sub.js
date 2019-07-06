define((require, exports, module)=>{
  const Subscription    = require('koru/pubsub/subscription');
  const User            = require('models/user');
  const OrgModels       = require('pubsub/org-models');

  class OrgSub extends Subscription {
    constructor(orgId) {
      super(orgId);
      const inOrg = (doc)=> doc.org_id === orgId;
      this.match('User', inOrg);
      for (const model of OrgModels)
        this.match(model.modelName, inOrg);
    }

    stopped(unmatch) {
      const org_id = this.args;
      User.where({org_id}).forEach(unmatch);
      for (const model of OrgModels) {
        model.where({org_id}).forEach(unmatch);
      }
    }
  }
  OrgSub.module = module;

  return OrgSub;
});
