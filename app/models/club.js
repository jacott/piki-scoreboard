var model = AppModel.Base.defineSubclass('Club',{
},{saveRpc: true});

model.defineFields({
  name: {type:  'text', trim: true, required: true, maxLength: 200},
  shortName: {type: 'text', trim: true, required: true, maxLength: 4, normalize: 'upcase'},
  org_id: 'belongs_to',
  contact_id: {type: 'belongs_to', modelName: 'User'}
});

model.addRemoveRpc();

App.loaded('AppModel.Club', model);
