define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Org = require('./org');

  var ROLE = {
    superUser: 's',
    spectator: 'p',
    climber: 'c',
    judge: 'j',
    admin: 'a',
  };

  var model = require('model').define(module, {
    accessClasses: function (orgId) {
      if (! this.isSuperUser() && this.org_id !== orgId)
        return "readOnly";

      var classes = "";
      switch(this.role) {
      case 's':
        classes += "sAccess ";
      case 'a':
        classes += "aAccess ";
      case 'j':
        classes += "jAccess";
      }

      return classes + " p";
    },
    emailWithName: function () {
      return this.name.replace('/<>/','')+" <"+this.email+">";
    },

    isSuperUser: function () {
      return this.attributes.role === ROLE.superUser;
    },

    canAdminister: function (doc) {
      switch(this.attributes.role) {
      case ROLE.superUser:
        return true;
      case ROLE.admin:
        return ! doc || (doc.attributes.org_id || doc.org_id) === this.org_id;
      }
      return false;
    },

    validate: function () {
      var me = model.me();
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
    },
  });

  util.extend(model, {
    me: function () {
      return koru.userId() && model.findById(koru.userId());
    },

    fetchAdminister: function (userId, doc) {
      var user = model.findById(userId);
      Val.allowAccessIf(user && user.canAdminister(doc));
      return user;
    },
  });


  model.ROLE = ROLE;

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    email: {type:  'text', trim: true, required: true, maxLength: 200,
            inclusion: {allowBlank: true, matches: util.EMAIL_RE },  normalize: 'downcase' , unique: true},
    initials: {type: 'text', trim: true, required: true, maxLength: 3},
    org_id: {type: 'belongs_to', required: function () {return this.role !== ROLE.superUser}},
    role: {type: 'text', inclusion: {in: util.values(ROLE)}},
  });

  require('koru/env!./user')(model);

  return model;
});
