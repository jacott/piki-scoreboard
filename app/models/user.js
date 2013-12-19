var model = AppModel.Base.defineSubclass('User',{
  emailWithName: function () {
    return this.name.replace('/<>/','')+" <"+this.email+">";
  },

},{saveRpc: true});

model.defineFields({
  name: {type:  'text', trim: true, required: true, maxLength: 200},
  email: {type:  'text', trim: true, required: true, maxLength: 200, inclusion: {allowBlank: true, matches: Apputil.EMAIL_RE },  normalize: 'downcase'},
  initials: {type: 'text', trim: true, required: true, maxLength: 3},
});


App.extend(model, {
  me: function () {
    return model.findOne(App.userId());
  },
});

App.loaded('models/user', model);
