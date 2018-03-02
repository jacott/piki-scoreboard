define(function(require, exports, module) {
  const koru            = require('koru');
  const makeSubject     = require('koru/make-subject');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const UserAccount     = require('koru/user-account');
  const util            = require('koru/util');
  const Role            = require('models/role');

  const roleCache$ = Symbol(), observers$ = Symbol();

  return function (User) {
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

    let orgObs = util.createDictionary();
    {
      require(['./change-log'], ChangeLog =>{ChangeLog.logChanges(User)});

      User.onChange((now, undo)=>{
        if (undo === null) {
          UserAccount.createUserLogin({email: now.email, userId: now._id});
          UserAccount.sendResetPasswordEmail(now);
        } else {
          if (undo && undo.email) {
            UserAccount.updateOrCreateUserLogin({userId: now._id, email: now.email});
          }
          if (now != null) {
            if (now._id === 'guest') return;
            Role.db.query(`select org_id, role from "Role" where user_id = '${now._id}'`)
              .forEach((role) => {
                const obs = orgObs[role.org_id];
                obs === undefined ||
                  urNotify(obs, now, role, undo, now == null);
              });
          }
        }
      });

      koru.onunload(module, Role.onChange((now, undo)=>{
        const role = now || undo;
        const obs = orgObs[role.org_id];
        obs === undefined ||
          urNotify(obs, User.findById(role.user_id), role, undo, now == null);
      }));

      const urNotify = (obs, realUser, role, undo, isRem)=>{
        const user = new User(Object.assign({
          role: role.role, org_id: role.org_id}, realUser.attributes));

        obs.notify(isRem ? null : user, isRem ? user : undo);
      };

      User.beforeSave(User, doc => {
        const {changes} = doc;
        if ('org_id' in changes) {
          const {org_id, role} = changes;
          delete changes.org_id;
          if (! ('role' in changes)) return;
          delete changes.role;
          if (role === 's') {
            let suFound = false;
            Role.where({user_id: doc._id}).forEach(r =>{
              if (suFound || r.role !== 's')
                r.$remove();
              if (r.role === 's') {
                suFound = true;
                r.org_id === undefined || r.$update('org_id', null);
              }
            });
            if (! suFound) {
              Role.create({user_id: doc._id, role: 's'});
            }
          } else {
            const roleDoc = Role.query.whereSql(
              `user_id = {$user_id} and (org_id is null or org_id = {$org_id})`,
              {org_id, user_id: doc._id}).fetchOne();
            if (roleDoc === undefined)
              Role.create({org_id, user_id: doc._id, role});
            else if (roleDoc.role !== role) {
              if (roleDoc.org_id === undefined)
                roleDoc.$update({org_id, role});
              else
                roleDoc.$update({role});
            }
          }
        }
      });
    }

    util.merge(User, {
      guestUser() {
        return User.findById('guest') || (
          User.docs.insert({_id: 'guest'}),
          User.findById('guest'));
      },

      observeOrg_id([org_id], callback) {
        return (orgObs[org_id] || (orgObs[org_id] = makeSubject(
          {}, undefined, undefined, {allStopped() {
            delete orgObs[org_id];
          }}
        ))).onChange(callback);
      }
    });

    const {ROLE} = User;

    util.merge(User.prototype, {
      authorize(userId) {
        const authUser = User.findById(userId);
        Val.allowAccessIf(authUser && ('org_id' in this.changes) && ('org_id' in this.changes));

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

        Val.allowAccessIf(Role.db.query(
          `select exists(select 1 from "Role" as r1 where user_id = {$userId} and
(org_id is null or (role = 'a' and org_id = {$orgId} and ${queryExt})))`,
          {userId, subjectId: this._id, orgId: this.changes.org_id})[0].exists);

        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);

        if (this.$isNewRecord()) {
          const existingUser = User.where({email: (this.email||'').trim().toLowerCase()}).fetchOne();
          if (existingUser !== undefined && existingUser.org_id !== this.changes.org_id) {
            this.attributes = existingUser.attributes;
            this.changes = {role: this.changes.role, org_id: this.changes.org_id};
          }
        }
      },

      canEdit(doc, roleRe) {
        if (doc == null || doc.attributes === undefined) return false;
        const role = Role.readRole(this._id, doc.attributes.org_id || doc.org_id);
        return roleRe.test(role.role);
      }
    });

    session.defineRpc("User.forgotPassword", function (email, challenge, response) {
      Val.ensureString(email);

      email = email.trim();
      if (!email) {
        return {email: 'is_required' };
      }
      email = util.parseEmailAddresses(email);
      if (! email || email.addresses.length !== 1 || email.remainder)
        return {email: 'is_invalid' };

      email = email.addresses[0].toLowerCase();

      var user = User.findBy('email', email);
      if (user) {
        var accUser = UserAccount.model.findBy('userId', user._id);
        accUser && UserAccount.sendResetPasswordEmail(user);
      }
      return {success: true};
    });
  };
});
