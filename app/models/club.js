var model = AppModel.Base.defineSubclass('Club',{
},{saveRpc: true});

model.defineFields({
  name: {type:  'text', trim: true, required: true, maxLength: 200},
  initials: {type: 'text', trim: true, required: true, maxLength: 3},
  org_id: 'belongs_to',
  contact_id: {type: 'belongs_to', modelName: 'User'}
});
