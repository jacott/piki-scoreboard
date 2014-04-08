var ROLE = {
  superUser: 's',
  spectator: 'p',
  climber: 'c',
  judge: 'j',
  admin: 'a',
};

var model = AppModel.Base.defineSubclass('User',{
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

  canAdminister: function () {
    switch(this.attributes.role) {
    case ROLE.superUser:
    case ROLE.admin:
      return true;
    }
    return false;
  },

  validate: function () {
    var me = AppModel.User.me();
    AppVal.allowAccessIf(me);
    if (me.isSuperUser()) return;
    if (this.isSuperUser() || this.role === 's')
      AppVal.addError(this, 'role', 'is_invalid');
    if (('org_id' in this.changes) &&
        (! this.$isNewRecord() || this.org_id !== me.org_id))
      AppVal.addError(this, 'org_id', 'is_invalid');
  }

},{saveRpc: true});

model.addRemoveRpc();

model.ROLE = ROLE;

model.defineFields({
  name: {type:  'text', trim: true, required: true, maxLength: 200},
  email: {type:  'text', trim: true, required: true, maxLength: 200, inclusion: {allowBlank: true, matches: Apputil.EMAIL_RE },  normalize: 'downcase' , unique: true},
  initials: {type: 'text', trim: true, required: true, maxLength: 3},
  org_id: {type: 'belongs_to', required: function () {return this.role !== ROLE.superUser}},
  role: {type: 'text', inclusion: {in: _.values(ROLE)}},
});


App.extend(model, {
  me: function () {
    return App.userId() && model.findOne(App.userId());
  },
});

App.loaded('AppModel.User', model);
