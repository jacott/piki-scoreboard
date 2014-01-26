App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Category',{
  },{saveRpc: true});

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 4, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    org_id: 'belongs_to',
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Category', model);
});
