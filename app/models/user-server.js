define((require, exports, module) => {
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const Observable      = require('koru/observable');
  const session         = require('koru/session');
  const UserAccount     = require('koru/user-account');
  const util            = require('koru/util');
  const Role            = require('models/role');

  return (User) => {
    const SELF_FIELD_SPEC = {
      org_id: 'id',
      name: 'string',
      initials: 'string',
      email: 'string',
    };

    const FIELD_SPEC = Object.assign({
      role: 'string',
    }, SELF_FIELD_SPEC);

    const NEW_FIELD_SPEC = {
      _id: 'id',
    };

    User.guestUser = async () => (await User.findById('guest')) ?? (
      await User.docs.insert({_id: 'guest'}),
      User.findById('guest'));

    const createLogin = async (user) => {
      await UserAccount.updateOrCreateUserLogin({email: user.email, userId: user._id});
      await UserAccount.sendResetPasswordEmail(user);
    };

    let orgObs = util.createDictionary();
    {
      require(['./change-log'], (ChangeLog) => {ChangeLog.logChanges(User)});

      User.onChange(async (dc) => {
        if (dc.isAdd) {
          await createLogin(dc.doc);
        } else {
          if (dc.hasField('email')) {
            await UserAccount.updateOrCreateUserLogin({userId: dc._id, email: dc.doc.email});
          }
          if (! dc.isDelete) {
            if (dc._id === 'guest') return;
            for (const role of await Role.db.query(`select org_id, role from "Role" where user_id = '${dc._id}'`)) {
              const obs = orgObs[role.org_id];
              if (obs !== undefined) {
                await obs.notify(dc.clone()._set(mergeRole(dc.doc, role), dc.undo));
              }
            }
          }
        }
      });

      koru.onunload(module, Role.onChange(async (dc) => {
        const {doc} = dc;
        const obs = orgObs[doc.org_id];
        if (obs !== undefined) {
          const user = await User.findById(doc.user_id);
          return user !== undefined && obs.notify(dc.clone()._set(mergeRole(user, doc), dc.undo));
        }
      }));

      const mergeRole = (user, role) => new User(Object.assign({
        role: role.role, org_id: role.org_id}, user.attributes));

      module.onUnload(User.beforeSave(async (doc) => {
        const {changes} = doc;
        if ('org_id' in changes) {
          const {org_id, role} = changes;
          delete changes.org_id;

          if (! ('role' in changes)) return;
          delete changes.role;
          if (role === 's') {
            let suFound = false;
            for await (const r of Role.where({user_id: doc._id})) {
              if (suFound || r.role !== 's') {
                await r.$remove();
              }
              if (r.role === 's') {
                suFound = true;
                r.org_id === undefined || await r.$update('org_id', null);
              }
            }
            if (! suFound) {
              await Role.create({user_id: doc._id, role: 's'});
            }
          } else {
            const roleDoc = await Role.query.whereSql(
              `user_id = {$user_id} and (org_id is null or org_id = {$org_id})`,
              {org_id, user_id: doc._id}).fetchOne();
            if (roleDoc === undefined) {
              if (role != null) {
                await Role.create({org_id, user_id: doc._id, role});
                await createLogin(doc);
              }
            } else if (roleDoc.role !== role) {
              if (role == null) {
                await roleDoc.$remove();
                if (! await Role.exists({user_id: doc._id})) {
                  await UserAccount.model.where({userId: doc._id}).remove();
                }
              } else if (roleDoc.org_id === undefined) {
                await roleDoc.$update({org_id, role});
              } else {
                await roleDoc.$update({role});
              }
            }
          }
        }
      }));

      User.observeOrg_id = ([org_id], callback) => {
        return (orgObs[org_id] ??= new Observable(() => {
          delete orgObs[org_id];
        })).add(callback);
      };
    }

    const {ROLE} = User;

    util.merge(User.prototype, {
      async authorize(userId) {
        const authUser = await User.findById(userId);

        Val.allowAccessIf(authUser && ('org_id' in this.changes));

        if (userId === this._id) {
          Val.assertDocChanges(this, SELF_FIELD_SPEC);
          return;
        }

        Val.allowAccessIf(authUser._id !== 'guest' && this._id !== 'guest');

        const roleMatchUserSQL = `select 1 from "Role" as r2 where user_id = {$subjectId}`;
        const changedFields = Object.keys(this.changes);

        const queryExt = changedFields.length == 2 && ('role' in this.changes)
              ? `exists(${roleMatchUserSQL} and r2.org_id = r1.org_id)`
              : `not exists(${roleMatchUserSQL} and (r2.org_id is null or r2.org_id <> r1.org_id))`;

        Val.allowAccessIf((await Role.db.query(
          `select exists(select 1 from "Role" as r1 where user_id = {$userId} and
(org_id is null or (role = 'a' and org_id = {$orgId} and ${queryExt})))`,
          {userId, subjectId: this._id, orgId: this.changes.org_id}))[0].exists);

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        if (this.$isNewRecord()) {
          const existingUser = await User.where({email: (this.email ?? '').trim().toLowerCase()}).fetchOne();
          if (existingUser !== undefined && existingUser.org_id !== this.changes.org_id) {
            this.attributes = existingUser.attributes;
            this.changes = {role: this.changes.role, org_id: this.changes.org_id};
          }
        }
      },

      async canEdit(doc, roleRe) {
        if (doc == null || doc.attributes === undefined) return false;
        const role = await Role.readRole(this._id, doc.attributes.org_id ?? doc.org_id);
        return roleRe.test(role.role);
      },
    });

    session.defineRpc('User.forgotPassword', async (email, challenge, response) => {
      Val.ensureString(email);

      email = email.trim();
      if (! email) {
        return {email: 'is_required'};
      }
      email = util.parseEmailAddresses(email);
      if (! email || email.addresses.length !== 1 || email.remainder) {
        return {email: 'is_invalid'};
      }

      email = email.addresses[0].toLowerCase();

      const user = await User.findBy('email', email);
      if (user !== undefined) {
        const accUser = await UserAccount.model.findBy('userId', user._id);
        accUser && await UserAccount.sendResetPasswordEmail(user);
      }
      return {success: true};
    });
  };
});
