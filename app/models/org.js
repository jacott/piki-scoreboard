var model = AppModel.Base.defineSubclass('Org',{
},{saveRpc: true});

model.defineFields({
  name: {type:  'text', trim: true, required: true, maxLength: 200},
  email: {type:  'text', trim: true, required: true, maxLength: 200, inclusion: {allowBlank: true, matches: Apputil.EMAIL_RE },  normalize: 'downcase'},
  initials: {type: 'text', trim: true, required: true, maxLength: 4},
});

App.loaded('AppModel.Org', model);
