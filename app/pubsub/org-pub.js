define((require, exports, module) => {
  const DocChange       = require('koru/model/doc-change');
  const Val             = require('koru/model/validation');
  const Publication     = require('koru/pubsub/publication');
  const Union           = require('koru/pubsub/union');
  const util            = require('koru/util');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');
  const OrgModels       = require('pubsub/org-models');

  const guestUnions = {}, adminUnions = {};

  let changeListener;

  const docChange = (dc) => {
    const {doc} = dc;
    const orgId = doc.org_id;
    const gu = guestUnions[orgId];
    gu !== undefined && gu.batchUpdate(dc);
    const au = adminUnions[orgId];
    au !== undefined && au.batchUpdate(dc);
  };

  const userDocChange = async (dc) => {
    if (! dc.isChange) return;
    for await (const role of Role.where('user_id', dc._id)) {
      const au = adminUnions[role.org_id];
      au !== undefined && au.batchUpdate(dc);
    }
  };

  const roleDocChange = (dc) => {
    const {doc} = dc;
    const au = adminUnions[doc.org_id];
    if (au !== undefined) {
      dc = dc.clone();
      dc._set(
        new User(
          Object.assign({org_id: doc.org_id, role: doc.role}, User.findById(doc.user_id).attributes)),
        dc.undo);
      au.batchUpdate(dc);
    }
  };

  const initChangeListener = () => {
    changeListener = OrgModels.map((m) => m.onChange(docChange));
    changeListener.push(
      User.onChange(userDocChange),
      Role.onChange(roleDocChange),
    );
  };

  const canAdministerOrg = async (userId, orgId) => {
    if (userId === 'guest') return false;
    const {role} = await Role.readRole(userId, orgId);

    return role === 's' || role === 'a';
  };

  const addGuestUnion = (sub, orgId) => {
    sub.union = guestUnions[orgId] || (guestUnions[orgId] = new GuestUnion(orgId));
    return sub.union.addSub(sub);
  };

  const addAdminUnion = (sub, orgId) => {
    sub.union = adminUnions[orgId] || (adminUnions[orgId] = new AdminUnion(orgId));
    return sub.union.addSub(sub);
  };

  class OrgPub extends Publication {
    async init(orgId) {
      const {userId} = this;
      this.lastSubscribed = 0;
      Val.allowAccessIf(userId && typeof orgId === 'string');

      const user = userId === 'guest' ? await User.guestUser() : await User.findById(userId);

      Val.allowAccessIf(user);

      await canAdministerOrg(userId, orgId)
        ? await addAdminUnion(this, orgId)
        : await addGuestUnion(this, orgId);
    }

    stop() {
      super.stop();
      this.union !== undefined && this.union.removeSub(this);
      this.union = undefined;
    }

    static shutdown() {
      if (changeListener !== undefined) for (const o of changeListener) o.stop();
      changeListener = undefined;
      for (const i in guestUnions) guestUnions[i] = undefined;
      for (const i in adminUnions) adminUnions[i] = undefined;
    }

    async userIdChanged(newUID, oldUID) {
      const {union} = this;
      const canAdmin = await canAdministerOrg(newUID, union.orgId);

      if (canAdmin && (union instanceof AdminUnion)) {
        return;
      }// no change

      union.removeSub(this);

      canAdmin
        ? await addAdminUnion(this, union.orgId)
        : await addGuestUnion(this, union.orgId);
    }
  }
  OrgPub.module = module;

  const FILTER_ATTRS = {dateOfBirth: true};

  const filterChange = (model, attrs) => {
    if (model === 'Climber') return util.mergeExclude({}, attrs, FILTER_ATTRS);

    return attrs;
  };

  class OrgUnion extends Union {
    constructor(orgId) {
      super();
      this.orgId = orgId;
      changeListener === undefined && initChangeListener();
    }
  }

  class AdminUnion extends OrgUnion {
    async loadInitial(encoder) {
      for (const model of OrgModels) {
        for await (const doc of model.where('org_id', this.orgId)) {encoder.addDoc(doc)}
      }

      for (const d of await User.db.query(
        `select u.*,r.role, r.org_id from "User" as u, "Role" as r
where (r.org_id is null or r.org_id = {$org_id}) and r.user_id = u._id
`, {org_id: this.orgId},
      )) {
        encoder.addDoc(new User(d));
      }
    }
  }

  class GuestUnion extends OrgUnion {
    buildUpdate(dc) {
      const upd = super.buildUpdate(dc);
      switch (upd[0]) {
      case 'A':
        upd[1][1] = filterChange(upd[1][0], upd[1][1]);
        break;
      case 'C':
        upd[1][2] = filterChange(upd[1][0], upd[1][2]);
        break;
      }
      return upd;
    }

    async loadInitial(encoder) {
      for (const model of OrgModels) {
        for await (const doc of model.where('org_id', this.orgId)) {
          const attrs = filterChange(model.modelName, doc.attributes);
          encoder.addDoc(attrs === doc.attributes ? doc : new model(attrs));
        }
      }
    }
  }

  return OrgPub;
});
