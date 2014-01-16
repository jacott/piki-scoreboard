var ROLE = {
  superUser: 's',
  spectator: 'p',
  climber: 'c',
  judge: 'j',
  admin: 'a',
};

var model = AppModel.Base.defineSubclass('User',{
  emailWithName: function () {
    return this.name.replace('/<>/','')+" <"+this.email+">";
  },

  isSuperUser: function () {
    return this.role.indexOf(ROLE.superUser) !== -1;
  },

},{saveRpc: true});

model.ROLE = ROLE;

model.defineFields({
  name: {type:  'text', trim: true, required: true, maxLength: 200},
  email: {type:  'text', trim: true, required: true, maxLength: 200, inclusion: {allowBlank: true, matches: Apputil.EMAIL_RE },  normalize: 'downcase'},
  initials: {type: 'text', trim: true, required: true, maxLength: 3},
  org_id: 'belongs_to',
  role: 'text',
});


App.extend(model, {
  me: function () {
    return App.userId() && model.findOne(App.userId());
  },
});

App.loaded('AppModel.User', model);
