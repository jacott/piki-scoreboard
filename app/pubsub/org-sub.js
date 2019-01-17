define((require, exports, module)=>{
  const Subscription    = require('koru/pubsub/subscription');
  const OrgModels       = require('pubsub/org-models');

  class OrgSub extends Subscription {
    constructor(orgId) {
      super(orgId);
      const inOrg = (doc)=> doc.org_id === orgId;
      for (const model of OrgModels)
        this.match(model.modelName, inOrg);
    }
  }
  OrgSub.module = module;

  return OrgSub;
});
