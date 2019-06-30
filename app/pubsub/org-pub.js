define((require, exports, module)=>{
  const DocChange       = require('koru/model/doc-change');
  const Val             = require('koru/model/validation');
  const Publication     = require('koru/pubsub/publication');
  const Union           = require('koru/pubsub/union');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');
  const OrgModels       = require('pubsub/org-models');

  const guestUnions = {}, adminUnions = {};

  let changeListener;

  const docChange = (dc)=>{
    const {doc} = dc;
    const orgId = doc.org_id;
    const gu = guestUnions[orgId];
    gu !== void 0 && gu.batchUpdate(dc);
    const au = adminUnions[orgId];
    au !== void 0 && au.batchUpdate(dc);
  };

  const userDocChange = (dc)=>{
    if (! dc.isChange) return;
    for (const role of Role.where('user_id', dc._id)) {
      const au = adminUnions[role.org_id];
      au !== void 0 && au.batchUpdate(dc);
    }
  };

  const roleDocChange = (dc)=>{
    const {doc} = dc;
    const au = adminUnions[doc.org_id];
    if (au !== void 0) {
      dc = dc.clone();
      dc._set(
        new User(
          Object.assign({org_id: doc.org_id, role: doc.role}, User.findById(doc.user_id).attributes)),
        dc.undo);
      au.batchUpdate(dc);
    }
  };

  const initChangeListener = ()=>{
    changeListener = OrgModels.map(m => m.onChange(docChange));
    changeListener.push(
      User.onChange(userDocChange),
      Role.onChange(roleDocChange)
    );
  };

  const canAdministerOrg = (userId, orgId)=>{
    if (userId === 'guest') return false;
    const {role} = Role.readRole(userId, orgId);

    return role === 's' || role === 'a';
  };

  const addGuestUnion = (sub, orgId)=>{
    sub.union = guestUnions[orgId] || (guestUnions[orgId] = new GuestUnion(orgId));
    sub.union.addSub(sub);
  };

  const addAdminUnion = (sub, orgId)=>{
    sub.union = adminUnions[orgId] || (adminUnions[orgId] = new AdminUnion(orgId));
    sub.union.addSub(sub);
  };

  class OrgPub extends Publication {
    init(orgId) {
      const {userId} = this;
      this.lastSubscribed = 0;
      Val.allowAccessIf(userId && typeof orgId === 'string');

      const user = userId === 'guest' ? User.guestUser() : User.findById(userId);

      Val.allowAccessIf(user);

      canAdministerOrg(userId, orgId) ?
        addAdminUnion(this, orgId) : addGuestUnion(this, orgId);
    }

    stop() {
      super.stop();
      this.union !== void 0 && this.union.removeSub(this);
      this.union = void 0;
    }

    static shutdown() {
      if (changeListener !== void 0) for (const o of changeListener) o.stop();
      changeListener = void 0;
      for (const i in guestUnions) guestUnions[i] = void 0;
      for (const i in adminUnions) adminUnions[i] = void 0;
    }
  }
  OrgPub.module = module;

  const filterChange = (cmd)=>{
    if (cmd[0] === 'Climber') delete cmd[2].dateOfBirth;
  };

  class OrgUnion extends Union {
    constructor(orgId) {
      super();
      this.orgId = orgId;
      changeListener === void 0 && initChangeListener();
    }

    loadInitial(encoder) {
      for (const model of OrgModels) model.where('org_id', this.orgId)
        .forEach(doc =>{encoder.addDoc(doc)});
    }
  }

  class AdminUnion extends OrgUnion {
    loadInitial(encoder) {
      super.loadInitial(encoder);
      User.db.query(
        `select u.*,r.role, r.org_id from "User" as u, "Role" as r
where (r.org_id is null or r.org_id = {$org_id}) and r.user_id = u._id
`, {org_id: this.orgId}
      ).forEach(d => {encoder.addDoc(new User(d))});
    }
  }

  class GuestUnion extends OrgUnion {
    buildUpdate(dc) {
      const upd = super.buildUpdate(dc);
      if (upd[0] === 'C') filterChange(upd[1]);
      return upd;
    }
  }

  return OrgPub;
});
