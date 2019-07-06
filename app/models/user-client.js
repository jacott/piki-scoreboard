define((require, exports, module)=>{
  const koru            = require('koru');
  const session         = require('koru/session');
  const util            = require('koru/util');

  return User =>{
    const {pretendRole} = module.config();

    const guest = new User({_id: 'guest'});

    User.guestUser = ()=> User.docs.guest === void 0 ? (User.docs.guest = guest) : guest;

    User.defineFields({
      org_id: {type: 'belongs_to'},
      role: {type: 'text', inclusion: {in: util.values(User.ROLE), allowBlank: true}},
    });

    if (pretendRole) {
      const desc = Object.getOwnPropertyDescriptor(User.prototype, 'safeRole');
      desc.get = function () {
        return this._id === koru.userId() ? pretendRole : this.attributes.role;
      };
      Object.defineProperty(User.prototype, 'safeRole', desc);
    }

    const {ROLE} = User;

    util.merge(User.prototype, {
      accessClasses(orgId) {
        if (this._id === 'guest' || (! this.isSuperUser() && this.org_id !== orgId))
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
      },

      get safeRole() {
        return this.attributes.role;
      },

      isSuperUser() {
        return this.safeRole === ROLE.superUser;
      },

      isAdmin() {
        switch (this.safeRole) {
        case ROLE.admin: case ROLE.superUser:
          return true;
        default:
          return false;
        }
      },

      canEdit(doc, roleRe) {
        const role = this.safeRole;
        if (roleRe.test(this.safeRole)) {
          return doc != null && doc.attributes !== undefined &&
            (role === 's' || ((doc.attributes.org_id) || doc.org_id) === this.org_id);
        }
        return false;
      }
    });

    util.merge(User, {
      forgotPassword(email, callback) {
        session.rpc("User.forgotPassword", email, callback);
      },
    });
  };
});
