define(function(require, exports, module) {
  const koru        = require('koru');
  const {BaseModel} = require('koru/model');
  const Val         = require('koru/model/validation');
  const util        = require('koru/util');
  const Org         = require('./org');

  const ROLE = {
    superUser: 's',
    spectator: 'p',
    climber: 'c',
    judge: 'j',
    admin: 'a',
  };

  class User extends BaseModel {
    accessClasses(orgId) {
      if (! this.isSuperUser() && this.org_id !== orgId)
        return "readOnly";

      let classes = "";
      switch(this.safeRole) {
      case 's':
        classes += "sAccess ";
      case 'a':
        classes += "aAccess ";
      case 'j':
        classes += "jAccess";
      }

      return classes + " p";
    }

    emailWithName() {
      return this.name.replace('/<>/','')+" <"+this.email+">";
    }

    get safeRole() {
      return this.attributes.role;
    }

    isSuperUser() {
      return this.safeRole === ROLE.superUser;
    }

    isAdmin() {
      switch (this.safeRole) {
      case ROLE.admin: case ROLE.superUser:
        return true;
      default:
        return false;
      }
    }

    canAdminister(doc) {
      switch(this.safeRole) {
      case ROLE.superUser:
        return true;
      case ROLE.admin:
        return ! doc || (doc.attributes.org_id || doc.org_id) === this.org_id;
      }
      return false;
    }

    validate() {
      var me = User.me();
      if (me && me.isSuperUser()) return;
      if (!me) {
        Val.addError(this, '_id', 'not_allowed');
        return;
      }
      if (this.isSuperUser() || this.role === 's')
        Val.addError(this, 'role', 'is_invalid');
      if (('org_id' in this.changes) &&
          (! this.$isNewRecord() || this.org_id !== me.org_id))
        Val.addError(this, 'org_id', 'is_invalid');
    }
    static me() {
      return koru.userId() && User.findById(koru.userId());
    }

    static fetchAdminister(userId, doc) {
      var user = User.toDoc(userId);
      Val.allowAccessIf(user && user.canAdminister(doc));
      return user;
    }
  }

  User.ROLE = ROLE;

  module.exports = User.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200},
      email: {type:  'text', trim: true, required: true, maxLength: 200,
              inclusion: {allowBlank: true, matches: util.EMAIL_RE },  normalize: 'downcase' , unique: true},
      initials: {type: 'text', trim: true, required: true, maxLength: 3},
      org_id: {type: 'belongs_to', required() {return this.role !== ROLE.superUser}},
      role: {type: 'text', inclusion: {in: util.values(ROLE)}},
    },
  });

  require('koru/env!./user')(User);

  return User;
});
